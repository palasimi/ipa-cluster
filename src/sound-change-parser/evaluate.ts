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

// Convert the environment into an array of distinct map keys.
// Returns an empty array if the environment is invalid.
function toEnvironmentString(environment: Environment): string[] {
  const befores = toSoundString(environment.before);
  const afters = toSoundString(environment.after);

  // Because each side of a sound change rule may contain a class of sounds.
  const keys = [];
  for (const before of befores) {
    for (const after of afters) {
      keys.push(`${before} _ ${after}`);
    }
  }
  return Array.from(new Set(keys));
}

// Converts parse tree into a map that can be used to query the existence of a
// sound change.
// The result is a map: language pair -> environment -> set of sound pairs.
function toMap(tree: Ruleset[]): Map<string, Map<string, Set<string>>> {
  const contextMap = new Map();

  for (const ruleset of tree) {
    const context = `${ruleset.context[0]} ${ruleset.context[1]}`;
    if (!contextMap.has(context)) {
      contextMap.set(context, new Map());
    }

    const environmentMap = contextMap.get(context);

    for (const rule of ruleset.rules) {
      // Expand classes in environment.
      for (const environment of toEnvironmentString(rule.environment)) {
        if (!environmentMap.has(environment)) {
          environmentMap.set(environment, new Set());
        }

        const pairSet = environmentMap.get(environment);
        // Expand classes in sound expressions.
        for (const lhs of toSoundString(rule.lhs)) {
          for (const rhs of toSoundString(rule.rhs)) {
            const pair = `${lhs} -> ${rhs}`;
            pairSet.add(pair);
          }
        }
      }
    }
  }

  return contextMap;
}

export type QueryOptions = {
  // Pair of language codes to which a sound change rule applies.
  context?: {
    left: string;
    right: string;
  };

  // Environment of the sound change.
  // E.g. "a _ #".
  environment?: {
    // This is the string before the "_".
    before: string;

    // This is the string after the "_".
    after: string;
  };
};

export type Querier = (a: string, b: string, options?: QueryOptions) => boolean;

// Turn the parse tree into a query function.
export function toQuerier(tree: Ruleset[]): Querier {
  const contextMap = toMap(tree);

  // Memoize query function, because it's expected to be called a lot.
  // Only global sound changes (no context or environment constraints) will be
  // cached, because if the cache indices are too specific, there would be a
  // lot of cache misses.
  const cache = new Map();

  // Check if sound change appears in the ruleset.
  return function querier(a: string, b: string, options: QueryOptions = {}) {
    // Get options.
    const left = options.context?.left || "*";
    const right = options.context?.right || "*";
    const before = options.environment?.before || "";
    const after = options.environment?.after || "";

    // Check cache.
    const key1 = `${a} ${b}`;
    const value1 = cache.get(key1);
    if (value1 != null) {
      return value1;
    }

    const key2 = `${b} ${a}`;
    const value2 = cache.get(key2);
    if (value2 != null) {
      return value2;
    }

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

    const pairs = [`${a} -> ${b}`, `${b} -> ${a}`];

    for (const context of contexts) {
      const environmentMap = contextMap.get(context);
      if (environmentMap == null) {
        continue;
      }

      for (const environment of environments) {
        const pairSet = environmentMap.get(environment);
        if (pairSet == null) {
          continue;
        }

        for (const pair of pairs) {
          if (pairSet.has(pair)) {
            // Save in cache if the query has no constraints.
            if (context === "* *" && environment === " _ ") {
              cache.set(key1, true);
              cache.set(key2, true);
            }
            return true;
          }
        }
      }
    }
    // There's no need to check for constraints, because it is certain that
    // even non-constrained queries would fail at this point.
    cache.set(key1, false);
    cache.set(key2, false);
    return false;
  };
}
