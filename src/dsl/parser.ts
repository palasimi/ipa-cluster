// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (c) 2023 Levi Gruspe
// DSL parser.

import {
  Constraint,
  IR,
  Rule,
  Ruleset,
  Sound,
  createUnconstrainedRuleset,
} from "./ir";
import { NameError, Scope } from "./scopes";
import { Tag, Token, tokenize } from "./tokenizer";

/**
 * Exception thrown by parser when it encounters an error during parsing.
 */
export class ParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

/**
 * Represents a sound environment in a rule.
 */
export type SoundEnvironment = {
  left: Sound[];
  right: Sound[];

  // Whether or not the environment was defined explicitly.
  explicit: boolean;
};

/**
 * Code parser.
 * Exported only for testing.
 */
export class Parser {
  private tokens: Token[];
  private index = 0;
  private scope: Scope<Sound> = new Scope();

  /**
   * @param code - Code to be parsed
   */
  constructor(code: string) {
    this.tokens = Array.from(tokenize(code));
  }

  /**
   * Checks if there are tokens left in the source program.
   */
  private isDone(): boolean {
    return this.index >= this.tokens.length;
  }

  /**
   * Peeks at the token an `offset` number of steps ahead of the current one,
   * without changing the token pointer.
   * Returns `undefined` if there are no tokens left.
   */
  private peek(offset = 0): Token | undefined {
    return this.tokens[this.index + offset];
  }

  /**
   * Peeks at the next `count` number of tokens.
   * May return fewer tokens than asked for if there are no tokens left in the
   * source program.
   *
   * @param count - Number of tokens to peek at
   */
  private peekN(count: number): Token[] {
    const tokens = [];
    const max = Math.min(this.index + count, this.tokens.length);
    for (let i = this.index; i < max; i++) {
      const token = this.tokens[i] as Token;
      tokens.push(token);
    }
    return tokens;
  }

  /**
   * Returns the current token and moves the pointer to the next token.
   *
   * If there are no tokens left in the input, returns `undefined`.
   */
  private move(): Token | undefined {
    if (this.isDone()) {
      return undefined;
    }
    const token = this.peek();
    this.index++;
    return token;
  }

  /**
   * Consumes a token from the input.
   * The token must match the specified tag.
   * If not, this method throws a `ParseError`.
   *
   * Returns the consumed token.
   *
   * @param tag - Expected tag of the next token
   * @param message - Error message
   */
  private expect(tag: Tag, message: string): Token {
    const token = this.move();
    if (token?.tag !== tag) {
      abort(token, message);
    }
    return token;
  }

  /**
   * Parses a sound value.
   * It should be non-empty.
   */
  parseSound(): Sound {
    const lookahead = this.peek();
    switch (lookahead?.tag) {
      case Tag.LeftBrace:
        return this.parseUnionSound();
      case Tag.Terminal:
        return this.parseTerminalSound();
      case Tag.Variable:
        return this.parseVariableSound();
      default:
        abort(lookahead, "expected a sound value");
    }
  }

  /**
   * Parses an assignment statement.
   * In general, assignment statements can be written as `A = B`,
   * where `A` is the variable name and `B` is the sound value to be assigned.
   *
   * This method defines the variable in the current scope.
   */
  parseAssignment() {
    const lhs = this.expect(Tag.Variable, "expected a variable name");
    this.expect(Tag.Equals, "expected '='");
    const rhs = this.parseSound();
    const ok = this.scope.define(lhs.literal, rhs);
    if (!ok) {
      abort(lhs, `cannot redefine the variable '${lhs.literal}'`);
    }
  }

  /**
   * Parses an IPA segment (a terminal).
   */
  parseTerminalSound(): Sound {
    const terminal = this.expect(Tag.Terminal, "expected an IPA segment");
    return [terminal.literal];
  }

  /**
   * Parses a variable that represents a sound value.
   * The value of the variable is resolved during parsing.
   */
  parseVariableSound(): Sound {
    const variable = this.expect(Tag.Variable, "expected a variable");
    try {
      return this.scope.resolve(variable.literal);
    } catch (error) {
      if (error instanceof NameError) {
        abort(variable, error.message);
      }
      throw error;
    }
  }

  /**
   * Parses a sound value that's enclosed by braces.
   * The value may be a null sound or a union of sounds.
   */
  parseUnionSound(): Sound {
    const choices = [];
    this.expect(Tag.LeftBrace, "expected '{'");
    while (!this.isDone() && (this.peek() as Token).tag !== Tag.RightBrace) {
      choices.push(...this.parseTerminalSound());
    }
    this.expect(Tag.RightBrace, "expected '}'");
    return choices;
  }

  /**
   * Parses a sequence of sounds.
   * Returns an array of `Sound`s.
   */
  parseSounds(): Sound[] {
    const sounds = [];
    for (;;) {
      const lookahead = this.peek();
      switch (lookahead?.tag) {
        case Tag.LeftBrace:
        case Tag.Terminal:
        case Tag.Variable:
          sounds.push(this.parseSound());
          break;
        default:
          return sounds;
      }
    }
  }

  /**
   * Parses the sound environment of a rule.
   * In general, a sound environment can be written as `/ A _ B`,
   * where `A` and `B` are sound values.
   *
   * Returns a `SoundEnvironment`.
   * Note that some rules don't specify a sound environment.
   */
  parseEnvironment(): SoundEnvironment {
    // Check if there's a slash.
    const lookahead = this.peek();
    if (lookahead?.tag !== Tag.Slash) {
      return {
        left: [],
        right: [],
        explicit: false,
      };
    }

    this.expect(Tag.Slash, "expected '/'");

    const left = this.parseSounds();
    this.expect(Tag.Underscore, "expected '_'");
    const right = this.parseSounds();
    return { left, right, explicit: true };
  }

  /**
   * Parses a simple rule (one that has no constraints).
   * Simple rules can be written as:
   * - `a b c ~ d e f` (transformational rules)
   * - `a ~ b / c _ d` (SPE-style)
   */
  parseSimpleRule(): Rule {
    const leftToken = this.peek();
    const left = this.parseSounds();
    this.expect(Tag.Tilde, "expected '~'");

    const rightToken = this.peek();
    const right = this.parseSounds();
    const environment = this.parseEnvironment();

    // Perform some checks.
    if (environment.explicit) {
      // Each side can have at most one sound value in an SPE-style rule.
      if (left.length > 1) {
        abort(
          leftToken as Token,
          "too many symbols on the left-hand side of an SPE-style rule"
        );
      }
      if (right.length > 1) {
        abort(
          rightToken as Token,
          "too many symbols on the right-hand side of an SPE-style rule"
        );
      }

      // Disallow "#" outside of an environment context in SPE-style rules.
      for (const sound of left) {
        if (sound.includes("#")) {
          abort(
            leftToken as Token,
            "unexpected '#' outside a sound environment in an SPE-style rule"
          );
        }
      }
      for (const sound of right) {
        if (sound.includes("#")) {
          abort(
            rightToken as Token,
            "unexpected '#' outside a sound environment in an SPE-style rule"
          );
        }
      }
    }

    // Include sound environment information in `left` and `right`.
    // Effectively, this converts SPE-style rules into string rewriting rules.
    return {
      left: [...environment.left, ...left, ...environment.right],
      right: [...environment.left, ...right, ...environment.right],
    };
  }

  /**
   * Parses a simple statement.
   * A simple statement can be an assignment statement or a simple rule
   * (one that has no constraints).
   *
   * Returns an array that contains at most one `Rule`.
   */
  parseSimpleStatement(): Rule[] {
    // We can detect if the next statement is an assignment statement by
    // looking for an equal sign.
    const lookahead = this.peek(1);
    if (lookahead?.tag === Tag.Equals) {
      this.parseAssignment();
      return [];
    }

    // We return an array for convenience,
    // when this method gets called in `parseStatement`.
    return [this.parseSimpleRule()];
  }

  /**
   * Parses language code.
   * See docstring for `isLanguageCode` for details on what language codes are
   * supposed to look like.
   *
   * Returns an array of language codes.
   */
  parseLanguageCodes(): string[] {
    const codes = [];

    // Stop parsing when we see something that doesn't look like a language
    // code.
    for (;;) {
      const lookahead = this.peek();
      switch (lookahead?.tag) {
        case Tag.Underscore:
          codes.push("_");
          this.move();
          break;

        case Tag.Terminal:
          if (isLanguageCode(lookahead.literal)) {
            codes.push(lookahead.literal);
            this.move();
            continue;
          }
          return codes;

        default:
          return codes;
      }
    }
  }

  /**
   * Parses a language selector/constraint.
   * Returns a pair of language codes.
   *
   * A language constraint consists of one or two language codes, and a dot.
   * If the constraint only contains one language, it is assumed that the
   * constraint applies to both sides of a rule.
   *
   * It's the caller's responsibility to check that the next tokens are part of
   * a language constraint.
   * This method doesn't do anything to check.
   */
  parseConstraint(): Constraint {
    const checkpoint = this.peek();
    const codes = this.parseLanguageCodes();

    this.expect(Tag.Dot, "expected '.'");

    // Check language codes.
    if (codes.length === 0) {
      abort(checkpoint, "expected a language code");
    }
    if (codes.length > 2) {
      abort(checkpoint as Token, "too many language codes in constraint");
    }
    return {
      left: codes[0],
      right: codes[1] || codes[0],
    };
  }

  /**
   * Parses a multi-line rule.
   * Every line is a simple statement preceded by a "|".
   *
   * Returns an array of `Rule`s.
   */
  parseMultiLineRule(): Rule[] {
    // Enter new scope.
    this.scope = new Scope(this.scope);

    const rules = [];

    for (;;) {
      const pipe = this.peek();
      if (pipe?.tag === Tag.Pipe) {
        this.move();
        rules.push(...this.parseSimpleStatement());
      } else {
        break;
      }

      const newline = this.peek();
      if (newline?.tag === Tag.Newline) {
        this.move();
      }
    }

    // Leave scope.
    this.scope = this.scope.outer as Scope<Sound>;
    return rules;
  }

  /**
   * Parses a compound statement.
   * A compound statement is a rule that has language constraints/selectors.
   * It can be a single-line or a multi-line rule.
   * Returns a `Ruleset`.
   */
  parseCompoundStatement(): Ruleset {
    const constraint = this.parseConstraint();

    // Ignore newline.
    if (this.peek()?.tag === Tag.Newline) {
      this.move();
    }

    const rules = [];
    const lookahead = this.peek();
    if (lookahead?.tag === Tag.Pipe) {
      rules.push(...this.parseMultiLineRule());
    } else {
      rules.push(this.parseSimpleRule());
    }

    return { constraint, rules };
  }

  /**
   * Parses a statement.
   * A statement is either a simple or a compound statement.
   *
   * Hierarchy of statements:
   * - simple
   *   - assignment
   *   - simple rule (no language constraints)
   * - compound
   *   - single-line rule with language constraints
   *   - multi-line rule with constraints (has nested simple statements)
   *
   * Returns the `Ruleset` defined by the statement.
   */
  parseStatement(): Ruleset {
    // Peek at the next three tokens.
    // If there's a dot, then we know that there's an upcoming compound
    // statement.
    const lookahead = this.peekN(3);
    const dot = lookahead.findIndex((token) => token.tag === Tag.Dot);
    if (dot >= 0) {
      return this.parseCompoundStatement();
    }
    return createUnconstrainedRuleset(this.parseSimpleStatement());
  }

  /**
   * Parses the source program.
   * Throws a `ParseError` if the source program has an error.
   *
   * A program is a sequence of statements.
   */
  parseProgram(): IR {
    const rulesets = [];
    while (!this.isDone()) {
      const token = this.peek() as Token;

      if (token.tag === Tag.Newline) {
        this.move();
        continue;
      }

      // Otherwise, the next line must be a statement.
      // We throw out empty rules, which are returned by assignment statements.
      const ruleset = this.parseStatement();
      if (ruleset.rules.length > 0) {
        rulesets.push(ruleset);
      }
    }
    return { rulesets };
  }
}

/**
 * Parses code.
 * Returns an intermediate representation if there are no errors in the code.
 * Otherwise, throws a `ParseError`.
 */
export function parse(code: string): IR {
  const parser = new Parser(code);
  return parser.parseProgram();
}

/**
 * Aborts the parser and throws a `ParseError`.
 *
 * @param token - Location of error
 * @param message - Error message
 */
function abort(token: Token | undefined, message: string): never {
  if (token == null) {
    throw new ParseError(`${message}; unexpected end-of-file`);
  }

  const { line, column, literal } = token;
  throw new ParseError(
    `${message} at line ${line}, column ${column}; found: ${literal}`
  );
}

/**
 * Checks if string looks like a language code.
 * This doesn't check if the language code is valid.
 */
function isLanguageCode(text: string): boolean {
  const re = /^(_|([a-z][-a-z]*[a-z]))$/;
  return re.test(text);
}
