// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (c) 2023 Levi Gruspe
// Test newCost.ts.

import { createCostFunction } from "../src/newCost";
import { levenshtein } from "../src/ipa-cluster/metrics";

import { strict as assert } from "assert";

describe("createCostFunction", () => {
  it("smoke test", () => {
    const code = `
      q ~ a
      w ~ s
      e ~ d
    `;
    const cost = createCostFunction(code);

    const first = ["q", "w", "e"];
    const second = ["a", "s", "d"];

    // Without a cost function, distance should be non-zero.
    assert.ok(levenshtein(first, second) > 0);

    // With the cost function, the two sequences should be considered equal.
    assert.equal(levenshtein(first, second, cost), 0);
  });
});
