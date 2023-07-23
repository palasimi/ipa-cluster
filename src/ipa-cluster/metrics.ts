// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (c) 2023 Levi Gruspe
// String metric/distance functions.

export interface Sequence {
  [key: number]: unknown;
  length: number;
}

export type CostFunctionOptions = {
  [key: string | number]: unknown;
};

// The cost function compares `s[i]` with `t[j]`.
// The cost should be 0 if the two are equal, positive otherwise.
// The larger the cost, the larger the distance.
// The cost function should handle negative indices.
// If, for example, `s[i]` is out of bounds, treat the value as "".
// I.e., `cost(s, t, i, j)` becomes the cost of inserting/deleting `t[j]`.
// If the index is negative, `-index - 1` gives the current position in the
// corresponding string.
export type CostFunction<T> = (
  s: T,
  t: T,
  i: number,
  j: number,
  options?: CostFunctionOptions
) => number;

// Default cost function for the Levenshtein distance.
function defaultCost<T extends Sequence>(
  s: T,
  t: T,
  i: number,
  j: number
): number {
  const a = s[i];
  const b = t[j];

  // The cost of insertion/deletion.
  if ((a == null && b != null) || (a != null && b == null)) {
    return 1;
  }
  // The cost of substitution.
  return a === b ? 0 : 1;
}

// Compute the weighted Levenshtein distance between two sequences.
// The options argument is passed to the cost function.
// It can be used to pass additional data to the cost function.
export function levenshtein<T extends Sequence>(
  s: T,
  t: T,
  cost: CostFunction<T> = defaultCost,
  options: CostFunctionOptions = {}
): number {
  // Initialize (|s| + 1)-by-(|t| + 1) matrix.
  // We'll use 1-indexed strings here.
  const distance = [];
  for (let i = 0; i < s.length + 1; i++) {
    distance.push(Array(t.length + 1).fill(0));
  }

  // Special case when either string is empty: the distance is just the total
  // cost to turn the empty string into the other string.
  // The cost is the total cost of insertions, because the only way to get the
  // next substring is to insert the missing character.
  for (let i = 0; i < s.length; i++) {
    // `s` is 0-indexed, so we'll add one to make it 1-indexed (needed by
    // `distance`).
    distance[i + 1][0] = distance[i][0] + cost(s, t, i, -1, options);
  }
  for (let j = 0; j < t.length; j++) {
    // `t` is 0-indexed, so we'll add one to make it 1-indexed (needed by
    // `distance`).
    distance[0][j + 1] = distance[0][j] + cost(s, t, -1, j, options);
  }

  for (let i = 0; i < s.length; i++) {
    for (let j = 0; j < t.length; j++) {
      if (s[i] === t[j]) {
        // We add one, because `distance` is 1-indexed, while the strings are
        // 0-indexed.
        distance[i + 1][j + 1] = distance[i][j];
        continue;
      }

      // There are three ways to get the next substring: by substitution, by
      // inserting the character from `s`, or by inserting the character from `t`.
      distance[i + 1][j + 1] = Math.min(
        distance[i][j] + cost(s, t, i, j, options),
        distance[i][j + 1] + cost(s, t, i, -j - 1, options),
        distance[i + 1][j] + cost(s, t, -i - 1, j, options)
      );
    }
  }

  // Recall that `distance` is 1-indexed, so we return the following instead of
  // `distance[s.length - 1][t.length - 1]`.
  return distance[s.length][t.length];
}
