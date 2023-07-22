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
    // If `left` and `right` segments are the same, there's no need to match
    // the context.
    const { left, right } = context;
    if (left === right) {
      return;
    }

    // TODO how to handle "#" and "_"? Throw an error?
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
    // TODO "#" instead of "_" for word boundaries?

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

    // TODO handle negative indices (see CustomCostFunction) params.
    return (
      this.leftAfterTrie.test(s.slice(i + 1), l1) &&
      this.rightAfterTrie.test(t.slice(j + 1), l2) &&
      this.leftBeforeTrie.test(s.slice(0, i).reverse(), l1) &&
      this.rightBeforeTrie.test(t.slice(0, j).reverse(), l2)
    );
  }
}
