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

  const defaultOptions = {
    context: {
      left: "*",
      right: "*",
    },
    environment: {
      before: "",
      after: "",
    },
  };

  // Check if sound change appears in the ruleset.
  return (a: string, b: string, options: QueryOptions = defaultOptions) => {
    const left = options.context?.left || "*";
    const right = options.context?.right || "*";
    let contexts = [`${left} ${right}`, `${left} *`, `* ${right}`, "* *"];
    contexts = Array.from(new Set(contexts));

    const before = options.environment?.before || "";
    const after = options.environment?.after || "";
    let environments = [
      `${before} _ ${after}`,
      `${before} _ `,
      ` _ ${after}`,
      ` _ `,
    ];
    environments = Array.from(new Set(environments));

    const pairs = Array.from(new Set([`${a} -> ${b}`, `${b} -> ${a}`]));

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
            return true;
          }
        }
      }
    }
    return false;
  };
}