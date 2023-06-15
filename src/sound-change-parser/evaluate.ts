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
  const keys: Set<string> = new Set();
  for (const before of befores) {
    for (const after of afters) {
      keys.add(`${before} _ ${after}`);
    }
  }
  return Array.from(keys);
}

// Converts parse tree into a map that can be used to query the existence of a
// sound change.
// The result is a map: language pair -> environment -> set of sound pairs.
function toMap(tree: Ruleset[]): Map<string, Map<string, Set<string>>> {
  const contextMap = new Map();

  for (const ruleset of tree) {
    let [left, right] = ruleset.context;

    // Whether to reverse order of languages or not.
    const reverse = right < left;
    if (reverse) {
      [left, right] = [right, left];
    }

    // TODO flatten key so that only one map is needed
    const context = `${left} ${right}`;
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
            // TODO shouldn't this rule also be added to the global context
            const pair = reverse ? `${rhs} -> ${lhs}` : `${lhs} -> ${rhs}`;
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
  const contextMap = toMap(tree);

  // Memoize query function, because it's expected to be called a lot.
  // Only global sound changes (no context or environment constraints) will be
  // cached, because if the cache indices are too specific, there would be a
  // lot of cache misses.
  const cache = new Map();

  // Check if sound change appears in the ruleset.
  return function querier(a: string, b: string, options: QueryOptions = {}) {
    // Get options.
    let left = options.context?.left || "*";
    let right = options.context?.right || "*";
    const before = options.environment?.before || "";
    const after = options.environment?.after || "";

    // Fix order of options.
    const reverse = right < left;
    if (reverse) {
      [a, b] = [b, a];
      [left, right] = [right, left];
    }

    // Check cache.
    // Note that only queries with no constraints are cached, so the order of
    // segments in the key don't have to match the order of languages.
    const key = a < b ? `${a} ${b}` : `${b} ${a}`;
    const value = cache.get(key);
    if (value != null) {
      return value;
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

    const pairs = [`${a} -> ${b}`];
    // If there are no additional constraints, only insert the reverse.
    if (contexts.length === 1) {
      pairs.push(`${b} -> ${a}`);
    }

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
              cache.set(key, true);
            }
            return true;
          }
        }
      }
    }
    return false;
  };
}
