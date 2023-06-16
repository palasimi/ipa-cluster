// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (c) 2023 Levi Gruspe

import { Environment, Ruleset, Sound } from "./tree";

// Convert the sound object into an array of distinct strings.
// Returns an empty array if the sound has an invalid type.
function toSoundString(sound: Sound): string[] {
  switch (sound.type) {
    case "empty":
      return [""];
    case "boundary":
      return ["#"];
    case "segment":
      return [sound.value];
    case "union":
      return Array.from(new Set(sound.value));
    default:
      return [];
  }
}

// Convert the environment into a set of distinct map keys.
// Returns an empty sete if the environment is invalid.
function toEnvironmentString(environment: Environment): Set<string> {
  const befores = toSoundString(environment.before);
  const afters = toSoundString(environment.after);

  // Because each side of a sound change rule may contain a class of sounds.
  const keys: Set<string> = new Set();
  for (const before of befores) {
    for (const after of afters) {
      keys.add(`${before} _ ${after}`);
    }
  }
  return keys;
}

// Converts parse tree into a map that can be used to query the existence of a
// sound change.
// The result is a map: sound pair -> set of defined constraints (language and
// environment info).
function toMap(tree: Ruleset[]): Map<string, Set<string>> {
  const sounds = new Map();
  for (const ruleset of tree) {
    const [left, right] = ruleset.context;

    for (const rule of ruleset.rules) {
      // Expand classes in environment constraint.
      const environments = toEnvironmentString(rule.environment);

      // Expand classes in sound change rule.
      for (const lhs of toSoundString(rule.lhs)) {
        for (const rhs of toSoundString(rule.rhs)) {
          // We make sure that the sound pair is sorted lexicographically, and
          // that the language info is aligned properly.
          const reverse = lhs > rhs;
          const context = reverse ? `${right} ${left}` : `${left} ${right}`;
          const key = reverse ? `${rhs} -> ${lhs}` : `${lhs} -> ${rhs}`;
          if (!sounds.has(key)) {
            sounds.set(key, new Set());
          }

          const set = sounds.get(key);
          for (const environment of environments) {
            set.add(`${context} / ${environment}`);
          }
        }
      }
    }
  }
  return sounds;
}

export type QueryOptions = {
  // Pair of language codes to which a sound change rule applies.
  context?: {
    left?: string;
    right?: string;
  };

  // Environment of the sound change.
  // E.g. "a _ #".
  environment?: {
    // This is the string before the "_".
    before?: string;

    // This is the string after the "_".
    after?: string;
  };
};

export type Querier = (a: string, b: string, options?: QueryOptions) => boolean;

// Turn the parse tree into a query function.
export function toQuerier(tree: Ruleset[]): Querier {
  const ruleMap = toMap(tree);

  // Memoize query function, because it's expected to be called a lot.
  // Only global sound changes (no context or environment constraints) will be
  // cached, because if the cache indices are too specific, there would be a
  // lot of cache misses.
  const cache = new Set();

  // Check if sound change appears in the ruleset.
  return function querier(a: string, b: string, options: QueryOptions = {}) {
    // Get options.
    let left = options.context?.left || "*";
    let right = options.context?.right || "*";
    const before = options.environment?.before || "";
    const after = options.environment?.after || "";

    // Fix order of options.
    const reverse = a > b;
    if (reverse) {
      [a, b] = [b, a];
      [left, right] = [right, left];
    }
    const key = `${a} -> ${b}`;

    // Check cache.
    // Note that only queries with no constraints are cached, so the order of
    // segments in the key don't have to match the order of languages.
    if (cache.has(key)) {
      return true;
    }

    // Get set of constraints.
    const set = ruleMap.get(key);
    if (set == null) {
      return false;
    }

    // Construct keys for set of constraints.
    const contexts = ["* *"];
    if (left !== "*") {
      contexts.push(`${left} *`);
    }
    if (right !== "*") {
      contexts.push(`* ${right}`);
    }
    if (left !== "*" && right !== "*") {
      contexts.push(`${left} ${right}`);
    }

    const environments = [" _ "];
    if (before !== "") {
      environments.push(`${before} _ `);
    }
    if (after !== "") {
      environments.push(` _ ${after}`);
    }
    if (before !== "" && after !== "") {
      environments.push(`${before} _ ${after}`);
    }

    // Check if rule is defined for the constraint.
    for (const context of contexts) {
      for (const environment of environments) {
        const constraint = `${context} / ${environment}`;
        if (set.has(constraint)) {
          // Save in cache if the query has no constraints.
          if (context === "* *" && environment === " _ ") {
            cache.add(key);
          }
          return true;
        }
      }
    }
    return false;
  };
}
