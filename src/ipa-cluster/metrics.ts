// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (c) 2023 Levi Gruspe

// String metric/distance functions.

export interface Sequence<T> {
  [key: number]: T;
  length: number;
}

// The cost function compares `s[i]` with `t[j]`.
// The cost should be 0 if the two are equal, positive otherwise.
// The larger the cost, the larger the distance.
// The cost function should handle negative indices.
// If, for example, `s[i]` is out of bounds, treat the value as "".
// I.e., `cost(s, t, i, j)` becomes the cost of inserting/deleting `t[j]`.
// If the index is negative, `-index - 1` gives the current position in the
// corresponding string.
export type CostFunction<T> = (
  s: Sequence<T>,
  t: Sequence<T>,
  i: number,
  j: number
) => number;

// Default cost function for the Levenshtein distance.
function defaultCost<T>(
  s: Sequence<T>,
  t: Sequence<T>,
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

// Total cost to turn an empty string into the given string.
function totalCost<T>(s: Sequence<T>, cost: CostFunction<T>): number {
  let total = 0;
  const t: Sequence<T> = [];
  for (let i = 0; i < s.length; i++) {
    total += cost(s, t, i, -1);
  }
  return total;
}

// Compute the weighted Levenshtein distance between two sequences.
export function levenshtein<T>(
  s: Sequence<T>,
  t: Sequence<T>,
  cost: CostFunction<T> = defaultCost
): number {
  // Special case: |s||t| = 0.
  if (s.length === 0) {
    return totalCost(t, cost);
  }
  if (t.length === 0) {
    return totalCost(s, cost);
  }

  // Initialize |s|-by-|t| matrix.
  const distance = [];
  for (let i = 0; i < s.length; i++) {
    distance.push(Array(t.length).fill(0));
  }

  // The cost is the total cost of insertions, because the only way to get the
  // next substring is to insert the missing character.
  for (let j = 1; j < t.length; j++) {
    distance[0][j] = distance[0][j - 1] + cost(s, t, -1, j);
  }
  for (let i = 1; i < s.length; i++) {
    distance[i][0] = distance[i - 1][0] + cost(s, t, i, -1);
  }

  for (let i = 1; i < s.length; i++) {
    for (let j = 1; j < t.length; j++) {
      if (s[i] === t[j]) {
        distance[i][j] = distance[i - 1][j - 1];
        continue;
      }

      // There are three ways to get the next substring: by substitution, by
      // inserting the character from `s`, or by inserting the character from `t`.
      distance[i][j] = Math.min(
        distance[i - 1][j - 1] + cost(s, t, i, j),
        distance[i - 1][j] + cost(s, t, i, -j - 1),
        distance[i][j - 1] + cost(s, t, -i - 1, j)
      );
    }
  }
  return distance[s.length - 1][t.length - 1];
}
