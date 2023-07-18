// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (c) 2023 Levi Gruspe
// Expanded intermediate representations.

import { Constraint } from "./ir";
import { concatenate, SequenceSound } from "./operators";
import { SquashedIR } from "./squash";

/**
 * A rule without `UnionSound`s.
 * An `ExpandedRule` indicates that the sequence of IPA segments on the `left`
 * is equivalent to the sequence on the `right`.
 */
export type ExpandedRule = {
  constraint: Constraint;
  left: SequenceSound;
  right: SequenceSound;
};

/**
 * An intermediate representation without `UnionSound`s.
 */
export type ExpandedIR = { rules: ExpandedRule[] };

/**
 * Expands rules with unions of sounds into a collection of rules.
 * For example, `{a b c} ~ {x y}` becomes:
 * ```
 * a ~ x
 * a ~ y
 * b ~ x
 * b ~ y
 * c ~ x
 * c ~ y
 * ```
 */
export function expand(ir: SquashedIR): ExpandedIR {
  const expandedRules: ExpandedRule[] = [];

  for (const { constraint, left, right } of ir.rules) {
    const leftSequences = concatenate(...left);
    const rightSequences = concatenate(...right);
    for (const leftSequence of leftSequences) {
      for (const rightSequence of rightSequences) {
        expandedRules.push({
          constraint,
          left: leftSequence,
          right: rightSequence,
        });
      }
    }
  }
  return { rules: expandedRules };
}
