// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (c) 2023 Levi Gruspe

import { createCostFunction } from "../src/cost";
import { levenshtein } from "../src/ipa-cluster/metrics";

import { strict as assert } from "assert";

describe("createCostFunction", () => {
  it("smoke test", () => {
    const ignores = `
      q -> a
      w -> s
      e -> d
    `;
    const cost = createCostFunction(ignores);

    const first = ["q", "w", "e"];
    const second = ["a", "s", "d"];

    // Without a cost function, distance should be non-zero.
    assert.ok(levenshtein(first, second) > 0);

    // With a cost function, the two sequences should be considered equal.
    assert.equal(levenshtein(first, second, cost), 0);
  });
});
