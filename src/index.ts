// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (c) 2023 Levi Gruspe

import { createCostFunction } from "./cost";
import { cluster, Data, Point } from "./ipa-cluster/cluster";
import { levenshtein } from "./ipa-cluster/metrics";

export type ClusterByIPAOptions = {
  // Same as `epsilon` option to `cluster`.
  epsilon?: number;

  // Sound changes to ignore penalties for.
  ignores?: string;
};

// Cluster words with similar IPA transcriptions together.
// Uses the OPTICS clustering algorithm and the Levenshtein distance function.
// `ignores` specifies edits/sound changes to not penalize.
// May raise `ParseError`.
export function clusterByIPA<T extends Data>(
  dataset: T[],
  options: ClusterByIPAOptions = {}
): T[][] {
  const cost = createCostFunction(options?.ignores || "");
  const metric = (p: Point, q: Point) => {
    const options = {
      left: p.language,
      right: q.language,
    };
    return levenshtein(p.ipa, q.ipa, cost, options);
  };
  return cluster(dataset, metric, options);
}
