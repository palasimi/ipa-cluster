// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (c) 2023 Levi Gruspe

import { dbscan } from "./dbscan";

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
  epsilon: 2,
  minPoints: 2,
};

// Cluster words with similar IPA transcriptions together.
export function cluster(
  dataset: Data[],
  metric: Metric,
  options: ClusterOptions = {}
): Data[][] {
  // Tokenize dataset.
  const tokenized = dataset.map((p) => {
    return {
      ipa: p.ipa.split(" "),
      language: p.language,
    };
  });

  const epsilon =
    options.epsilon != null ? options.epsilon : defaultOptions.epsilon;

  const clusters = dbscan(tokenized, epsilon, metric);

  // Convert indices to values.
  return clusters.map((cluster) => cluster.map((i) => dataset[i]));
}
