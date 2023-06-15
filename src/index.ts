// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (c) 2023 Levi Gruspe

import { cluster, Data, Point } from "./ipa-cluster/cluster";
import {
  CostFunction,
  CostFunctionOptions,
  levenshtein,
  Sequence,
} from "./ipa-cluster/metrics";
import { parse, toQuerier } from "./sound-change-parser/index";

// Create cost function for IPA clustering.
// The sound changes in `code` are exempted from penalties when computing edit
// distances.
// May raise `ParseError`.
function createCostFunction(code: string): CostFunction<string> {
  const tree = parse(code);
  const hasRule = toQuerier(tree);

  return function customCost(
    s: Sequence<string>,
    t: Sequence<string>,
    i: number,
    j: number,
    options: CostFunctionOptions = {}
  ) {
    const a = s[i] || "";
    const b = t[j] || "";

    if (a === b) {
      return 0;
    }

    const left = (options.left as string) || "*";
    const right = (options.right as string) || "*";
    const context = { left, right };

    const environmentS = {
      before: s[i - 1] || "#",
      after: s[i + 1] || "#",
    };
    const environmentT = {
      before: t[j - 1] || "#",
      after: t[j + 1] || "#",
    };

    const optionsS = { context, environment: environmentS };
    const optionsT = { context, environment: environmentT };
    return hasRule(a, b, optionsS) ? 0 : hasRule(a, b, optionsT) ? 0 : 1;
  };
}

export type ClusterByIPAOptions = {
  // Same as `epsilon` option to `cluster`.
  epsilon?: number;

  // Sound changes to ignore penalties for.
  ignores?: string;
};

const defaultOptions = {
  epsilon: 1.1,
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
  const ignores = options?.ignores || "";

  const cost = createCostFunction(ignores);
  const metric = (p: Point, q: Point) => {
    const options = {
      left: p.language,
      right: q.language,
    };
    return levenshtein(p.ipa, q.ipa, cost, options);
  };
  return cluster(dataset, metric, { epsilon });
}
