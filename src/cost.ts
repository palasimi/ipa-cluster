// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (c) 2023 Levi Gruspe

import { CostFunction, CostFunctionOptions } from "./ipa-cluster/metrics";

import { compile } from "./dsl/index";

/**
 * Creates cost function for IPA clustering.
 * May raise `ParseError`.
 */
export function createCostFunction(code: string): CostFunction<string[]> {
  const querier = compile(code);
  return function customCost(
    s: string[],
    t: string[],
    i: number,
    j: number,
    options: CostFunctionOptions = {}
  ) {
    const l1 = (options.left as string) || "_";
    const l2 = (options.right as string) || "_";

    const found = querier.query(s, t, i, j, l1, l2);
    return found ? 0 : 1;
  };
}
