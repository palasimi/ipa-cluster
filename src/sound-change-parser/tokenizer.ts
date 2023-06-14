// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (c) 2023 Levi Gruspe

// Iterate through tokens in code.
export function* tokenize(code: string): Iterable<string> {
  const lines = code.split("\n");
  for (const line of lines) {
    const tokens = line.split(/\s+/);
    for (const token of tokens) {
      if (token.startsWith("--")) {
        break;
      }
      if (token.length > 0) {
        yield token;
      }
    }
    yield "\n";
  }
}
