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
    // `left <= right` after splitting, so we don't have to check again.
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
   * @param t - An array of IPA segments
   * @param i - Index to an element in `s`
   * @param j - Index to an element in `t`
   * @param l1 - Language of `s`
   * @param l2 - Language of `t`
   */
  query(
    s: string[],
    t: string[],
    i: number,
    j: number,
    l1: string,
    l2: string
  ): boolean {
    // Construct map key.
    // "_" stands for "delete the opposite segment."
    let a = s[i] || "_";
    let b = t[j] || "_";
    // TODO use "#" instead of "_" for word boundaries?

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
    return matcher.test(s, t, i, j, l1, l2);
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
