// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (c) 2023 Levi Gruspe
// Split intermediate representations.

import { AlignedIR } from "./align";
import { Constraint } from "./ir";

/**
 * A `SplitRule` is a rule for comparing a pair of sounds within a word
 * (e.g. `a ~ b`).
 * However, it only applies when the sounds are in the appropriate context.
 */
export type SplitRule = {
  // Language constraint
  constraint: Constraint;

  // IPA segment on the left-hand side
  left: string;

  // IPA segment on the right-hand side
  right: string;

  // IPA segments preceding the `left` segment, from nearest to furthest.
  leftBeforeContext: string[];

  // IPA segments following the `left` segment, from nearest to furthest.
  leftAfterContext: string[];

  // IPA segments preceding the `right` segment, from nearest to furthest.
  rightBeforeContext: string[];

  // IPA segments following the `right` segment, from nearest to furthest.
  rightAfterContext: string[];
};

/**
 * A collection of `SplitRule`s.
 */
export type SplitIR = { rules: SplitRule[] };

/**
 * Compiles an `AlignedIR` into a `SplitIR`.
 */
export function split(ir: AlignedIR): SplitIR {
  const rules = [];

  for (const rule of ir.rules) {
    const { constraint, left: leftSequence, right: rightSequence } = rule;

    for (let i = 0; i < leftSequence.length; i++) {
      // The two sequences are aligned.
      const leftSound = leftSequence[i];
      const rightSound = rightSequence[i];

      // Define contexts.
      const leftBeforeContext = leftSequence.slice(0, i).reverse();
      const leftAfterContext = leftSequence.slice(i + 1);
      const rightBeforeContext = rightSequence.slice(0, i).reverse();
      const rightAfterContext = rightSequence.slice(i + 1);

      // Create a rule for `leftSound ~ rightSound`.
      const splitRule = {
        constraint,
        left: leftSound,
        right: rightSound,
        leftBeforeContext,
        leftAfterContext,
        rightBeforeContext,
        rightAfterContext,
      };
      rules.push(splitRule);
    }
  }

  return { rules };
}
