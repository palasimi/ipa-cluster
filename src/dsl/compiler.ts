// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (c) 2023 Levi Gruspe
// DSL compiler.

import { Context, ContextMatcher } from "./context";
import { finalize } from "./final";
import { parse } from "./parser";

/**
 * Used for querying rules.
 */
export class Querier {
  private map: Map<string, ContextMatcher> = new Map();

  /**
   * Adds a rule.
   */
  add(rule: Context) {
    const { left, right } = rule;
    const key = `${left}~${right}`;

    if (!this.map.has(key)) {
      this.map.set(key, new ContextMatcher());
    }
    const matcher = this.map.get(key) as ContextMatcher;
    matcher.add(rule);
  }
}

/**
 * Compiles code into a rule query function.
 * May throw `ParseError`s during parsing.
 */
export function compile(code: string): Querier {
  const querier = new Querier();

  const ir = finalize(parse(code));
  for (const rule of ir.rules) {
    querier.add(rule);
  }
  return querier;
}
