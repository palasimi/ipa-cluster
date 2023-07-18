// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (c) 2023 Levi Gruspe
// Intermediate representations.

/**
 * Represents a sound value.
 *
 * - An empty array represents a null sound.
 * - An array with a single segment represents the sound of that segment.
 * - An array with multiple elements means "any of these sounds."
 */
export type Sound = string[];

/**
 * Represents an unconstrained rule.
 */
export type Rule = {
  // Left-hand side of a rule (left of "~")
  left: Sound[];

  // Right-hand side of a rule (right of "~")
  right: Sound[];
};

/**
 * Represents a language constraint on a rule.
 * `left` applies to the left-hand side of a rule,
 * while `right` applies to the right-hand side.
 * Their values are language codes or "_" (means any language).
 */
export type Constraint = {
  left: string;
  right: string;
};

/**
 * Represents a ruleset with a language constraint.
 * The constraint applies to all rules in the set.
 */
export type Ruleset = {
  constraint: Constraint;
  rules: Rule[];
};

/**
 * Create an unconstrained ruleset.
 */
export function createUnconstrainedRuleset(rules: Rule[]): Ruleset {
  return {
    constraint: {
      left: "_",
      right: "_",
    },
    rules,
  };
}

/**
 * Intermediate representation that the parser produces.
 * A program is a sequence of rulesets.
 */
export type IR = {
  rulesets: Ruleset[];
};
