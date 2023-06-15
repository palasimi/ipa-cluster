// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (c) 2023 Levi Gruspe

// Clustering algorithm.
import { OPTICS } from "density-clustering";

export type Data = {
  // Space-separated list of segments.
  ipa: string;
};

// Each element is an IPA segment/sound.
export type Metric = (a: string[], b: string[]) => number;

export type ClusterOptions = {
  epsilon: number;
};

const defaultOptions = {
  // Words in the same cluster can differ by up to 1 edit.
  epsilon: 1.1,
};

// Cluster words with similar IPA transcriptions together.
export function cluster(
  dataset: Data[],
  metric: Metric,
  options: ClusterOptions = defaultOptions
): Data[][] {
  const epsilon = options.epsilon;
  const minPoints = 2;

  const optics = new OPTICS();
  const indices = dataset.map((_, index: number) => index);

  // Pre-compute all distances.
  const cache: Map<string, number> = new Map();
  for (const [i, a] of dataset.entries()) {
    const ipaA = a.ipa.split(" ");

    for (let j = 0; j < i; ++j) {
      const b = dataset[j];
      const ipaB = b.ipa.split(" ");

      const key = `${j} ${i}`;
      const value = metric(ipaA, ipaB);
      cache.set(key, value);
    }
  }

  const newMetric = (i: number, j: number) => {
    if (i === j) {
      return 0;
    }
    if (j < i) {
      [i, j] = [j, i];
    }
    return cache.get(`${i} ${j}`);
  };
  // @types/density-clustering seems to have a bug.
  // @ts-ignore
  const clusters = optics.run(indices, epsilon, minPoints, newMetric);
  return clusters.map((group: number[]) => group.map((i) => dataset[i]));
}
