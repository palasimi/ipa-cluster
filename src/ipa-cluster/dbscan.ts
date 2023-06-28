// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (c) 2023 Levi Gruspe

// Implements a simplified DBSCAN (clustering algorithm).

import { StaticDisjointSet } from "mnemonist";

// Simplified DBSCAN implementation with minPoints = 2.
// Returns array of arrays of clusters (as indices).
export function dbscan<T>(
  dataset: T[],
  epsilon: number,
  distance: (a: T, b: T) => number
): number[][] {
  // When minPoints = 2, DBSCAN clusters are like connected components in a graph.
  const sets = new StaticDisjointSet(dataset.length);
  for (let i = 1; i < dataset.length; i++) {
    for (let j = 0; j < i; j++) {
      const a = dataset[j];
      const b = dataset[i];
      if (distance(a, b) <= epsilon) {
        sets.union(i, j);
      }
    }
  }

  // TODO compute recommended epsilon using mnemonist/vp-tree
  return sets.compile();
}
