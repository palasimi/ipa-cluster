// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (c) 2023 Levi Gruspe
// Code tokenizer.

/**
 * Represents a type of token.
 */
export enum Tag {
  EOF,

  Dot,
  Equals,
  LeftBrace,
  Newline,
  Pipe,
  RightBrace,
  Slash,
  Tilde,

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
   * Moves the pointer past the next space-delimited word.
   * Returns the string in-between (stripped of whitespace) as a token.
   */
  private moveUntilSpace(): Token {
    while (isSpace(this.peek())) {
      this.move();
    }

    const line = this.line;
    const column = this.column;

    const chars = [];
    for (;;) {
      const char = this.peek();

      // We explicitly check for newlines, because `isSpace` doesn't consider
      // it a space character.
      if (char === "" || char === "\n" || isSpace(char)) {
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
   * Emits a space-delimited token (e.g. variable name or string).
   */
  private emitSpaceDelimited(): Token {
    return this.moveUntilSpace();
  }

  /**
   * Emits the next token in the code.
   */
  nextToken(): Token {
    if (this.isDone()) {
      return this.createToken(Tag.EOF, "");
    }

    while (isSpace(this.peek())) {
      this.move();
    }

    switch (this.peek()) {
      // Separators.
      case ".":
        return this.emit(Tag.Dot, ".");
      case "/":
        return this.emit(Tag.Slash, "/");
      case "=":
        return this.emit(Tag.Equals, "=");
      case "\n":
        return this.emit(Tag.Newline, "\n");
      case "{":
        return this.emit(Tag.LeftBrace, "{");
      case "|":
        return this.emit(Tag.Pipe, "|");
      case "}":
        return this.emit(Tag.RightBrace, "}");
      case "~":
        return this.emit(Tag.Tilde, "~");

      // Special terminals.
      case "#":
        return this.emit(Tag.Terminal, "#");
      case "_":
        return this.emit(Tag.Terminal, "_");

      // Reserved symbols.
      // These symbols aren't used yet.
      case "!":
      case "$":
      case "%":
      case "&":
      case "'":
      case "(":
      case ")":
      case "*":
      case "+":
      case ",":
      case ":":
      case ";":
      case "<":
      case ">":
      case "?":
      case "@":
      case "[":
      case "\\":
      case "]":
      case "^":
      case "`":
      case '"':
        return this.emit(Tag.Reserved, "");

      // Ignore comments.
      case "-":
        if (this.peek(1) === "-") {
          this.skip();
          return this.nextToken();
        }
        return this.emit(Tag.Reserved, "-");

      // Space-delimited tokens.
      default:
        return this.emitSpaceDelimited();
    }
  }
}

/**
 * Tokenizes code.
 * Emits `Token`s.
 */
export function* tokenize(code: string, infinite = false): Iterable<Token> {
  const tokenizer = new Tokenizer(code);
  for (;;) {
    const token = tokenizer.nextToken();
    if (token.tag === Tag.EOF && !infinite) {
      break;
    }
    yield token;
  }
}

/**
 * Checks if the string is a whitespace character.
 * Since newlines are significant, we won't treat them as whitespace.
 */
function isSpace(text: string): boolean {
  const re = /[^\s]|\n/;
  return !re.test(text);
}

/**
 * Checks if the string is a valid variable name.
 * Variable names must be capitalized, and must only consist of alphanumeric
 * symbols.
 */
function isName(text: string): boolean {
  const re = /^[A-Z][A-Za-z0-9]$/;
  return re.test(text);
}
