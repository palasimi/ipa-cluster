// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (c) 2023 Levi Gruspe

// Implements a simplified DBSCAN (clustering algorithm).

import { StaticDisjointSet, VPTree } from "mnemonist";

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
  return sets.compile();
}

// Suggests an epsilon value to use with dbscan according to the "elbow"
// method.
export function suggestEpsilon<T>(
  dataset: T[],
  distance: (a: T, b: T) => number
): number {
  // A `VPTree` can be constructed in O(nlogn).
  const tree = VPTree.from(dataset, distance);

  // Compute distances of 2nd nearest neighbors.
  // This takes around O(nlogn) (O(logn) for each data point).
  const distances = [];
  for (const data of dataset) {
    const neighbors = tree.nearestNeighbors(2, data);
    distances.push(neighbors[neighbors.length - 1].distance);
  }
  distances.sort((a, b) => a - b);

  // Find the elbow/point with sharpest slope.
  let maxSlope = 0;
  let index = 0;
  for (let i = 1; i < distances.length; i++) {
    const slope = distances[i] - distances[i - 1];
    if (slope > maxSlope) {
      maxSlope = slope;
      index = i;
    }
  }

  // Suggest the elbow.
  return distances[index] || 0;
}
