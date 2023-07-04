// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (c) 2023 Levi Gruspe

import { dbscan, suggestEpsilon } from "./dbscan";
import { precompute } from "./utils";

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
};

// Cluster words with similar IPA transcriptions together.
export function cluster<T extends Data>(
  dataset: T[],
  metric: Metric,
  options: ClusterOptions = {}
): T[][] {
  // Tokenize dataset.
  const tokenized = dataset.map((p) => {
    return {
      ipa: p.ipa.split(" "),
      language: p.language,
    };
  });

  const precomputedDistance = precompute(tokenized, metric);
  const indices = tokenized.map((_, i) => i);

  const epsilon =
    options.epsilon != null
      ? options.epsilon
      : suggestEpsilon(indices, precomputedDistance);
  const clusters = dbscan(indices, epsilon, precomputedDistance);

  // Convert indices to values.
  return clusters.map((cluster) => cluster.map((i) => dataset[i]));
}
