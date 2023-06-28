// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (c) 2023 Levi Gruspe

import { createCostFunction } from "./cost";
import { cluster, Data, Point } from "./ipa-cluster/cluster";
import { levenshtein } from "./ipa-cluster/metrics";

export type ClusterByIPAOptions = {
  // Same as `epsilon` option to `cluster`.
  epsilon?: number;

  // Same as `minPoints` option to `cluster`.
  minPoints?: number;

  // Sound changes to ignore penalties for.
  ignores?: string;
};

const defaultOptions = {
  epsilon: 1.1,
  minPoints: 2,
  ignores: "",
};

// Cluster words with similar IPA transcriptions together.
// Uses the OPTICS clustering algorithm and the Levenshtein distance function.
// `ignores` specifies edits/sound changes to not penalize.
// May raise `ParseError`.
export function clusterByIPA(
  dataset: Data[],
  options: ClusterByIPAOptions = defaultOptions
): Data[][] {
  const epsilon = options?.epsilon || defaultOptions.epsilon;
  const minPoints = options?.minPoints || defaultOptions.minPoints;
  const ignores = options?.ignores || "";

  const cost = createCostFunction(ignores);
  const metric = (p: Point, q: Point) => {
    const options = {
      left: p.language,
      right: q.language,
    };
    return levenshtein(p.ipa, q.ipa, cost, options);
  };
  return cluster(dataset, metric, { epsilon, minPoints });
}
