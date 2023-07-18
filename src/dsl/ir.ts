// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (c) 2023 Levi Gruspe
// Intermediate representations.

/**
 * Represents a type of sound.
 * Variable isn't a type, because variables can be resolved during parsing.
 */
export enum SoundTag {
  Null,
  Union,

  // Includes "#" and "_" (means "any", not the location of the sound change)
  Terminal,
}

/**
 * Various types of sound values.
 */
export type NullSound = {
  tag: SoundTag.Null;
};
export type TerminalSound = {
  tag: SoundTag.Terminal;
  value: string;
};
export type UnionSound = {
  tag: SoundTag.Union;
  choices: TerminalSound[];
};

/**
 * Represents a single sound value.
 */
export type Sound = NullSound | TerminalSound | UnionSound;

/**
 * Functions for creating sound values.
 */
export function createNullSound(): NullSound {
  return {
    tag: SoundTag.Null,
  };
}

export function createTerminalSound(terminal: string): TerminalSound {
  return {
    tag: SoundTag.Terminal,
    value: terminal,
  };
}

export function createUnionSound(
  first: TerminalSound,
  ...rest: TerminalSound[]
): UnionSound {
  // The parameters look a bit weird, because we have to make sure that the
  // list of choices is non-empty.
  return {
    tag: SoundTag.Union,
    choices: [first, ...rest],
  };
}

/**
 * Represents a sound environment in a rule.
 */
export type SoundEnvironment = {
  left: Sound[];
  right: Sound[];

  // Whether or not the environment was defined explicitly.
  explicit: boolean;
};

/**
 * Represents an unconstrained rule.
 */
export type Rule = {
  // Left-hand side of a rule (left of "~")
  left: Sound[];

  // Right-hand side of a rule (right of "~")
  right: Sound[];

  environment: SoundEnvironment;
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
