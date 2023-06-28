// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (c) 2023 Levi Gruspe

// Clustering algorithm.
import { OPTICS } from "density-clustering";

export type Data = {
  // Space-separated list of segments.
  ipa: string;

  // Language code.
  language?: string;
};

// Post-processed data.
export type Point = {
  // Tokens of IPA segments.
  ipa: string[];

  // Language code.
  language?: string;
};

export type Metric = (p: Point, q: Point) => number;

export type ClusterOptions = {
  epsilon?: number;
  minPoints?: number;
};

const defaultOptions = {
  // Words in the same cluster can differ by up to 1 edit.
  epsilon: 1.1,
  minPoints: 2,
};

// Cluster words with similar IPA transcriptions together.
export function cluster(
  dataset: Data[],
  metric: Metric,
  options: ClusterOptions = {}
): Data[][] {
  // Pre-compute all distances.
  const cache: Map<string, number> = new Map();
  for (const [i, a] of dataset.entries()) {
    const ipaA = a.ipa.split(" ");

    for (let j = 0; j < i; ++j) {
      const b = dataset[j];
      const p = {
        language: a.language,
        ipa: ipaA,
      };
      const q = {
        language: b.language,
        ipa: b.ipa.split(" "),
      };

      const key = `${j} ${i}`;
      const value = metric(p, q);
      cache.set(key, value);
    }
  }

  // Find clusters.
  const newMetric = (i: number, j: number) => {
    if (i === j) {
      return 0;
    }
    if (j < i) {
      [i, j] = [j, i];
    }
    return cache.get(`${i} ${j}`);
  };

  const epsilon =
    options.epsilon != null ? options.epsilon : defaultOptions.epsilon;
  const minPoints =
    options.minPoints != null ? options.minPoints : defaultOptions.minPoints;

  const optics = new OPTICS();
  const indices = dataset.map((_, index: number) => index);

  // @types/density-clustering seems to have a bug.
  // @ts-ignore
  const clusters = optics.run(indices, epsilon, minPoints, newMetric);
  return clusters.map((group: number[]) => group.map((i) => dataset[i]));
}
