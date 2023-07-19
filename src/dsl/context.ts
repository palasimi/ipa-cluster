// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (c) 2023 Levi Gruspe
// Context-matching.

import { AcyclicMachine } from "./machines";
import { SplitRule } from "./split";

/**
 * Queries should match some `Context` stored in a `ContextMatcher`.
 */
export type Context = SplitRule;

/**
 * Context matcher.
 */
export class ContextMatcher {
  // We don't use `TrieMap`s for matching, because those are used to find words
  // in the trie that match the given prefix.
  // Instead, we want to find the prefixes stored in a data structure that
  // match the given word.
  // See the Wiki page for "Deterministic acyclic finite state automaton."
  private leftBeforeMachine: AcyclicMachine = new AcyclicMachine();
  private leftAfterMachine: AcyclicMachine = new AcyclicMachine();
  private rightBeforeMachine: AcyclicMachine = new AcyclicMachine();
  private rightAfterMachine: AcyclicMachine = new AcyclicMachine();

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
    this.leftBeforeMachine.add(leftBeforeContext, constraint.left);
    this.leftAfterMachine.add(leftAfterContext, constraint.left);
    this.rightBeforeMachine.add(rightBeforeContext, constraint.right);
    this.rightAfterMachine.add(rightAfterContext, constraint.right);
  }

  /**
   * Tests if `s[i]` and `t[j]` match any of the stored contexts.
   *
   * @param s - An array of IPA segments
   * @param i - Index to an element in `s`
   * @param t - An array of IPA segments
   * @param j - Index to an element in `t`
   * @param l1 - Language of `s`
   * @param l2 - Language of `t`
   */
  test(
    s: string[],
    i: number,
    t: string[],
    j: number,
    l1: string,
    l2: string
  ): boolean {
    // TODO what if `s[i]` or `t[j]` is "" and is not out of bounds?
    let a = s[i] || "#";
    let b = t[j] || "#";

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

    // TODO test left-before, left-after, right-before and right-after contexts
    // TODO handle negative indices (see CustomCostFunction) params.
    if (!this.leftAfterMachine.test(s.slice(i + 1), l1)) {
      return false;
    }
    if (!this.rightAfterMachine.test(t.slice(j + 1), l2)) {
      return false;
    }
    if (!this.leftBeforeMachine.test(s.slice(0, i).reverse(), l1)) {
      return false;
    }
    if (!this.rightBeforeMachine.test(t.slice(0, j).reverse(), l2)) {
      return false;
    }
    return true;
  }
}
