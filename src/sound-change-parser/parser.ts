// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (c) 2023 Levi Gruspe

import { Scope } from "./scopes";
import { tokenize } from "./tokenizer";
import { Context, EmptySound, Environment, Rule, Ruleset, Sound } from "./tree";

export class ParseError extends Error {}

// Checks if the first character is in [A-Z].
function isCapitalizedASCIILetter(text: string): boolean {
  const code = text.charCodeAt(0);
  return 65 <= code && code <= 90;
}

// Converts an array of tokens into a `Sound`.
// May return an error `Sound`.
function toSound(scope: Scope, tokens: string[]): Sound {
  if (tokens.length === 0) {
    return { type: "empty" };
  }

  if (tokens.length === 1) {
    const token = tokens[0];
    if (token === "#") {
      return { type: "boundary" };
    }
    if (token === "∅") {
      return { type: "empty" };
    }
    if (isCapitalizedASCIILetter(token)) {
      const sound = scope.resolve(token);
      if (sound.type !== "error") {
        return sound;
      }
      throw new ParseError(`variable '${token}' is not defined`);
    }
    return { type: "segment", value: token };
  }

  if (tokens[0] === "{" && tokens[tokens.length - 1] === "}") {
    return { type: "union", value: tokens.slice(1, tokens.length - 1) };
  }
  return { type: "error" };
}

class Parser {
  // Tokens in code.
  tokens: string[];

  // Current index.
  index = 0;

  // Global scope.
  scope: Scope = new Scope();

  constructor(code: string) {
    this.tokens = Array.from(tokenize(code));
  }

  // Returns the current token without advancing the tokenizer.
  // Returns an empty string if there are no tokens left.
  peek(offset = 0): string {
    return this.tokens[this.index + offset] || "";
  }

  // Returns current token and advances to the next.
  // Throws `ParseError` if there are no tokens left.
  advance(): string {
    if (this.index >= this.tokens.length) {
      throw new ParseError("expected a token");
    }
    return this.tokens[this.index++];
  }

  // Advances past the specified token.
  // Returns all the tokens in between, excluding the target token.
  advancePast(target: string): string[] {
    const tokens = [];
    for (;;) {
      const token = this.advance();
      if (token === target) {
        break;
      }
      tokens.push(token);
    }
    return tokens;
  }

  // Advance up to the first token that matches any of the specified tokens
  // without going past it.
  // The empty string is always assumed to be one of these tokens.
  // Returns all the tokens in between, excluding the target token.
  advanceUntil(...targets: string[]): string[] {
    const set = new Set(targets);
    set.add("");

    const tokens = [];
    for (;;) {
      const token = this.peek();
      if (set.has(token)) {
        break;
      }
      tokens.push(token);
      this.advance();
    }
    return tokens;
  }

  // Parses the left-hand side of a sound change rule.
  parseLeftHandSide(): Sound {
    const tokens = this.advancePast("->");
    const sound = toSound(this.scope, tokens);
    if (sound.type === "error") {
      throw new ParseError("too many symbols on the left-hand side");
    }
    if (sound.type === "boundary") {
      throw new ParseError("unexpected '#' outside of an environment context");
    }
    return sound;
  }

  // Parses the right-hand side of a sound change rule.
  parseRightHandSide(): Sound {
    const tokens = this.advanceUntil("/", "\n");
    const sound = toSound(this.scope, tokens);
    if (sound.type === "error") {
      throw new ParseError("too many symbols on the right-hand side");
    }
    if (sound.type === "boundary") {
      throw new ParseError("unexpected '#' outside of an environment context");
    }
    return sound;
  }

  // Of the form: `_ a` or `a _` or `a _ b`.
  // This part of a rule is optional.
  parseEnvironment(): Environment {
    const empty: EmptySound = { type: "empty" };
    const token = this.advance();
    if (token === "\n") {
      return { before: empty, after: empty };
    }

    if (token !== "/") {
      throw new ParseError("expected '/'");
    }

    const before = toSound(this.scope, this.advancePast("_"));
    if (before.type === "error") {
      throw new ParseError("too many symbols before '_'");
    }

    const after = toSound(this.scope, this.advancePast("\n"));
    if (after.type === "error") {
      throw new ParseError("too many symbols after '_'");
    }
    return { before, after };
  }

  // Generally, a rule can be written as: `a -> b / c _ d`.
  parseRule(): Rule {
    const lhs = this.parseLeftHandSide();
    const rhs = this.parseRightHandSide();
    const environment = this.parseEnvironment();
    return { lhs, rhs, environment };
  }

  // Parses an assignment such as: `A = a`.
  // The left-hand side must be capitalized and the right-hand side must be a
  // valid sound value.
  // This method returns nothing, but defines the variable in the current scope.
  parseAssignment() {
    const lhs = this.advance();
    if (!isCapitalizedASCIILetter(lhs)) {
      throw new ParseError("expected variable name to be capitalized");
    }

    if (this.advance() !== "=") {
      throw new ParseError("expected '='");
    }

    const rhs = this.advancePast("\n");
    const sound = toSound(this.scope, rhs);
    if (sound.type === "error") {
      throw new ParseError("too many symbols on the right-hand side");
    }
    if (sound.type === "boundary") {
      throw new ParseError("unexpected '#' outside of an environment context");
    }

    const ok = this.scope.define(lhs, sound);
    if (!ok) {
      throw new ParseError(`variable ${lhs} is already defined`);
    }
  }

  // A ruleset context is a pair of language codes.
  // `*` can be used to represent any language.
  // The language codes are not checked.
  parseContext(): Context {
    return [this.advance(), this.advance()];
  }

  // Enters current scope.
  parseEnterScope() {
    if (this.advance() !== "{") {
      throw new ParseError("expected '{'");
    }
    this.scope = new Scope(this.scope);
  }

  // Leaves current scope.
  parseLeaveScope() {
    if (this.advance() !== "}") {
      throw new ParseError("expected '}'");
    }
    if (this.scope.outer == null) {
      throw new ParseError("unexpected '}'");
    }
    this.scope = this.scope.outer;
  }

  // A ruleset is a context followed by a sequence of rules enclosed by
  // brackets.
  parseRuleset(): Ruleset {
    const context = this.parseContext();
    this.parseEnterScope();

    const rules = [];

    while (this.peek() !== "}") {
      if (this.peek() === "\n") {
        this.advance();
      } else if (this.peek(1) === "=") {
        this.parseAssignment();
      } else {
        const rule = this.parseRule();
        rules.push(rule);
      }
    }

    this.parseLeaveScope();
    return { context, rules };
  }

  // A document is a collection of rulesets and rules.
  // If a rule is not wrapped inside a ruleset, the rule is applied to every
  // language pair.
  parseDocument(): Ruleset[] {
    const rulesets: Ruleset[] = [];
    while (this.peek() !== "") {
      if (this.peek() === "\n") {
        this.advance();
      } else if (this.peek(1) === "=") {
        this.parseAssignment();
      } else if (this.peek(2) === "{" && this.peek(1) !== "->") {
        // The reason for the second check is because of anonymous classes.
        rulesets.push(this.parseRuleset());
      } else {
        rulesets.push({
          context: ["*", "*"],
          rules: [this.parseRule()],
        });
      }
    }
    return rulesets;
  }
}

// Parses rulesets from the code.
// May raise a `ParseError`.
export function parse(code: string): Ruleset[] {
  const parser = new Parser(code);
  return parser.parseDocument();
}
