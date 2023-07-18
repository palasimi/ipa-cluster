// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (c) 2023 Levi Gruspe
// Code tokenizer.

/**
 * Exception thrown by `Tokenizer` when it runs out of tokens.
 */
export class EOFError extends Error {}

/**
 * Represents a type of token.
 */
export enum Tag {
  Dot,
  Equals,
  LeftBrace,
  Newline,
  Pipe,
  RightBrace,
  Slash,
  Tilde,
  Underscore,

  Reserved,

  // Space-delimited strings
  Terminal,
  Variable,
}

/**
 * Represents a token in the source program.
 * Contains some information for debugging and error handling.
 */
export type Token = {
  line: number;
  column: number;
  tag: Tag;
  literal: string;
};

/**
 * Map of seperator symbols and their corresponding tags.
 */
const separators = new Map([
  [".", Tag.Dot],
  ["/", Tag.Slash],
  ["=", Tag.Equals],
  ["\n", Tag.Newline],
  ["_", Tag.Underscore],
  ["{", Tag.LeftBrace],
  ["|", Tag.Pipe],
  ["}", Tag.RightBrace],
  ["~", Tag.Tilde],
]);

/**
 * Set of reserved symbols.
 * These symbols aren't used yet by the language.
 */
const reserved = new Set([
  "!",
  "$",
  "%",
  "&",
  "'",
  "(",
  ")",
  "*",
  "+",
  ",",
  "-",
  ":",
  ";",
  "<",
  ">",
  "?",
  "@",
  "[",
  "\\",
  "]",
  "^",
  "`",
  '"',
]);

/**
 * Special terminal symbols.
 * These symbols are not allowed to be a substring in variable names and other
 * terminal symbols (e.g. IPA segments).
 */
const terminals = new Set(["#"]);

/**
 * Set of word breakpoints.
 * These symbols cannot be used in strings and variable names.
 */
const breakpoints = new Set([
  "",
  ...reserved,
  ...separators.keys(),
  ...terminals,
]);

/**
 * Code tokenizer.
 */
class Tokenizer {
  private code: string;
  private line = 0;
  private column = 0;
  private index = 0;

  /**
   * @param code - Code to be tokenized
   */
  constructor(code: string) {
    this.code = code;
  }

  /**
   * Checks if there are characters left in the input.
   */
  private isDone(): boolean {
    return this.index >= this.code.length;
  }

  /**
   * Returns the character `offset` steps from the current one.
   * If there are no characters left, returns an empty string.
   */
  private peek(offset = 0): string {
    return this.code[this.index + offset] || "";
  }

  /**
   * Returns the current character and moves the pointer to the next.
   * Also updates the line and column numbers if needed.
   *
   * If there are no characters left in the input, returns an empty string.
   */
  private move(): string {
    if (this.isDone()) {
      return "";
    }

    const char = this.peek();
    this.index++;
    this.column++;

    if (char === "\n") {
      this.column = 0;
      this.line++;
    }
    return char;
  }

  /**
   * Moves the pointer past the next word breakpoint.
   * Returns the string in-between (stripped of whitespace) as a token.
   */
  private moveUntilBreakpoint(): Token {
    while (isSpace(this.peek())) {
      this.move();
    }

    const line = this.line;
    const column = this.column;

    const chars = [];
    for (;;) {
      const char = this.peek();
      if (isSpace(char) || breakpoints.has(char)) {
        break;
      }
      chars.push(char);
      this.move();
    }
    const literal = chars.join("").trim();
    return {
      line,
      column,
      tag: isName(literal) ? Tag.Variable : Tag.Terminal,
      literal,
    };
  }

  /**
   * Skip to the end of the line.
   * Does not skip over newlines.
   */
  private skip() {
    for (;;) {
      const char = this.peek();
      if (char === "" || char === "\n") {
        break;
      }
      this.move();
    }
  }

  /**
   * Creates a token.
   */
  private createToken(tag: Tag, literal: string): Token {
    return {
      line: this.line,
      column: this.column,
      tag,
      literal,
    };
  }

  /**
   * Emits the specified token and advances the tokenizer by one step.
   */
  private emit(tag: Tag, literal: string): Token {
    const token = this.createToken(tag, literal);
    this.move();
    return token;
  }

  /**
   * Emits a word (e.g. strings and variables).
   */
  private emitWord(): Token {
    return this.moveUntilBreakpoint();
  }

  /**
   * Emits the next token in the code.
   * Throws an `EOFError` if there are no tokens left.
   */
  nextToken(): Token {
    // Remove insignificant whitespace.
    while (isSpace(this.peek())) {
      this.move();
    }

    // Check if there are tokens left.
    if (this.isDone()) {
      throw new EOFError();
    }

    const lookahead = this.peek();

    // Ignore comments.
    if (lookahead === "-") {
      if (this.peek(1) === "-") {
        this.skip();
        return this.nextToken();
      }
      return this.emit(Tag.Reserved, "-");
    }

    // Reserved symbols.
    // It's important to ignore comments before checking for reserved symbols,
    // because "-" is also a reserved symbol.
    if (reserved.has(lookahead)) {
      return this.emit(Tag.Reserved, lookahead);
    }

    // Separators.
    if (separators.has(lookahead)) {
      return this.emit(separators.get(lookahead) as Tag, lookahead);
    }

    // Special terminal symbols.
    if (terminals.has(lookahead)) {
      return this.emit(Tag.Terminal, lookahead);
    }

    // Variable names and terminals.
    return this.emitWord();
  }
}

/**
 * Tokenizes code.
 * Returns an array of `Token`s.
 */
export function tokenize(code: string): Token[] {
  const tokens = [];
  const tokenizer = new Tokenizer(code);
  for (;;) {
    try {
      tokens.push(tokenizer.nextToken());
    } catch (error) {
      if (error instanceof EOFError) {
        break;
      }
      throw error;
    }
  }
  return tokens;
}

/**
 * Checks if the string is a whitespace character.
 * Since newlines are significant, we won't treat them as whitespace.
 */
function isSpace(text: string): boolean {
  if (text === "\n") {
    return false;
  }
  const re = /^\s+$/;
  return re.test(text);
}

/**
 * Checks if the string is a valid variable name.
 * Variable names must be capitalized, and must only consist of alphanumeric
 * symbols.
 */
function isName(text: string): boolean {
  const re = /^[A-Z][A-Za-z0-9]*$/;
  return re.test(text);
}
