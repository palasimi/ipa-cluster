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

  const cache: Map<string, number> = new Map();
  const newMetric = (i: number, j: number) => {
    [i, j] = [Math.min(i, j), Math.max(i, j)];
    const key = `${i} ${j}`;
    if (!cache.has(key)) {
      const a = dataset[i];
      const b = dataset[j];
      const value = metric(a.ipa.split(" "), b.ipa.split(" "));
      cache.set(key, value);
    }
    return cache.get(key);
  };
  // @types/density-clustering seems to have a bug.
  // @ts-ignore
  const clusters = optics.run(indices, epsilon, minPoints, newMetric);
  return clusters.map((group: number[]) => group.map((i) => dataset[i]));
}
