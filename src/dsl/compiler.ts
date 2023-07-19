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

  /**
   * Checks if the query satisfies a defined rule.
   *
   * @param s - An array of IPA segments
   * @param i - Index to an element in `s`
   * @param t - An array of IPA segments
   * @param j - Index to an element in `t`
   * @param l1 - Language of `s`
   * @param l2 - Language of `t`
   */
  query(
    s: string[],
    i: number,
    t: string[],
    j: number,
    l1: string,
    l2: string
  ): boolean {
    // TODO handle negative indices
    let a = s[i] || "#";
    let b = t[j] || "#";

    if (a === b) {
      return true;
    }

    if (b < a) {
      [s, t] = [t, s];
      [i, j] = [j, i];
      [a, b] = [b, a];
      [l1, l2] = [l2, l1];
    }

    const key = `${a}~${b}`;
    const matcher = this.map.get(key);
    if (matcher == null) {
      return false;
    }
    return matcher.test(s, i, t, j, l1, l2);
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
