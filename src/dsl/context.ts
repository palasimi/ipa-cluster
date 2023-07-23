// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (c) 2023 Levi Gruspe
// Context-matching.

import { SplitRule } from "./split";
import { Trie } from "./trie";

/**
 * Queries should match some `Context` stored in a `ContextMatcher`.
 */
export type Context = SplitRule;

/**
 * Context matcher.
 */
export class ContextMatcher {
  private leftBeforeTrie: Trie = new Trie();
  private leftAfterTrie: Trie = new Trie();
  private rightBeforeTrie: Trie = new Trie();
  private rightAfterTrie: Trie = new Trie();

  /**
   * Adds a context to the `ContextMatcher`.
   */
  add(context: Context) {
    // There are cases where a context/split rule does not need to be added.
    // See `split()`.
    // We'll check again here just to be sure.

    const { left, right } = context;
    if (left === right || left === "#" || right === "#") {
      return;
    }

    const {
      constraint,
      leftBeforeContext,
      leftAfterContext,
      rightBeforeContext,
      rightAfterContext,
    } = context;
    this.leftBeforeTrie.add(leftBeforeContext, constraint.left);
    this.leftAfterTrie.add(leftAfterContext, constraint.left);
    this.rightBeforeTrie.add(rightBeforeContext, constraint.right);
    this.rightAfterTrie.add(rightAfterContext, constraint.right);
  }

  /**
   * Tests if `s[i]` and `t[j]` match any of the stored contexts.
   *
   * @param s - An array of IPA segments
   * @param t - An array of IPA segments
   * @param i - Index to an element in `s`
   * @param j - Index to an element in `t`
   * @param l1 - Language of `s`
   * @param l2 - Language of `t`
   */
  test(
    s: string[],
    t: string[],
    i: number,
    j: number,
    l1: string,
    l2: string
  ): boolean {
    let a = s[i] || "_";
    let b = t[j] || "_";

    // There's no need to match the context if the symbols are the same.
    if (a === b) {
      return true;
    }

    if (b < a) {
      [s, t] = [t, s];
      [i, j] = [j, i];
      [a, b] = [b, a];
      [l1, l2] = [l2, l1];
    }
    return (
      this.leftAfterTrie.test(extractAfter(s, i), l1) &&
      this.rightAfterTrie.test(extractAfter(t, j), l2) &&
      this.leftBeforeTrie.test(extractBefore(s, i), l1) &&
      this.rightBeforeTrie.test(extractBefore(t, j), l2)
    );
  }
}

/**
 * Extracts the strings before the given position.
 * Negative indices are used to indicate that there's a deleted element near
 * position `i`.
 *
 * The result is reversed so that the first element of the array is the nearest
 * to `i` and the last element is the furthest.
 * Also adds "#" at the end of the result (word boundary).
 */
function extractBefore(s: string[], i: number): string[] {
  const result = i >= 0 ? s.slice(0, i) : s.slice(0, -i);
  result.reverse();
  result.push("#");
  return result;
}

/**
 * Extracts the strings after the given position.
 * Negative indices are used to indicate that there's a deleted element near
 * position `i`.
 *
 * Adds "#" at the end of the result to mark the end of the sequence.
 */
function extractAfter(s: string[], i: number): string[] {
  const result = i >= 0 ? s.slice(i + 1) : s.slice(-i);
  result.push("#");
  return result;
}
