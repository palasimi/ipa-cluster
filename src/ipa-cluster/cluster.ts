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

  const newMetric = (a: Data, b: Data) => {
    return metric(a.ipa.split(" "), b.ipa.split(" "));
  };
  // @types/density-clustering seems to have a bug.
  // @ts-ignore
  const clusters = optics.run(dataset, epsilon, minPoints, newMetric);
  return clusters.map((indices: number[]) => indices.map((i) => dataset[i]));
}
