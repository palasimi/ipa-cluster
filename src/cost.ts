// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (c) 2023 Levi Gruspe

import { CostFunction, CostFunctionOptions } from "./ipa-cluster/metrics";

import { parse, toQuerier } from "./sound-change-parser/index";

// Create cost function for IPA clustering.
// The sound changes in `code` are exempted from penalties when computing edit
// distances.
// May raise `ParseError`.
export function createCostFunction(code: string): CostFunction<string[]> {
  const tree = parse(code);
  const hasRule = toQuerier(tree);

  return function customCost(
    s: string[],
    t: string[],
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
