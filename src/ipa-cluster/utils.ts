// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (c) 2023 Levi Gruspe

// Some utils for dealing with distance functions.

// Precomputes distances.
// The return value is a function with faster lookups.
export function precompute<T>(
  dataset: T[],
  distance: (a: T, b: T) => number
): (i: number, j: number) => number {
  // Create a "flattened" upper triangular matrix to store distances in.
  // Derivation of mapping:
  //    0   1   2   3   4
  // 0      0   1   2   3
  // 1          4   5   6
  // 2              7   8
  // 3                  9
  //
  // (0, j) -> j - 1
  // (1, j) -> (n-1 - 1) + j - 1 = n + j - 3
  // (2, j) -> (n + n-1 - 3) + j - 2 = 2n + j - 6
  // (3, j) -> (2n + n-1 - 6) + j - 3 = 3n + j - 10
  //
  // (i, j) -> ni + j - ((i+1)-th triangular number)
  // (i, j) -> ni + j - (i + 1)(i + 2)/2

  const n = dataset.length;

  // Size of the flattened array is just the (n-1)-th triangular number.
  const size = (n * (n - 1)) / 2;
  const distances = Array(size);

  // Pre-compute.
  for (let j = 1; j < n; j++) {
    for (let i = 0; i < j; i++) {
      const index = n * i + j - ((i + 1) * (i + 2)) / 2;
      distances[index] = distance(dataset[i], dataset[j]);
    }
  }

  return (i: number, j: number) => {
    if (i === j) {
      return 0;
    }
    if (i > j) {
      [i, j] = [j, i];
    }
    const index = n * i + j - ((i + 1) * (i + 2)) / 2;
    return distances[index];
  };
}
