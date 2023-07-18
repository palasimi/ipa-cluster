// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (c) 2023 Levi Gruspe
// Squashed intermediate representations.

import { Constraint, IR, Rule } from "./ir";

/**
 * A rule with a language constraint.
 */
export type SquashedRule = Rule & { constraint: Constraint };

/**
 * A squashed intermediate representation.
 * The rules are flattened into a single array to make them easier to process.
 */
export type SquashedIR = { rules: SquashedRule[] };

/**
 * Squashes an `IR` for further processing.
 */
export function squash(ir: IR): SquashedIR {
  const squashedRules = [];
  for (const { constraint, rules } of ir.rulesets) {
    for (const rule of rules) {
      const squashedRule = {
        ...rule,
        constraint,
      };
      squashedRules.push(squashedRule);
    }
  }
  return { rules: squashedRules };
}
