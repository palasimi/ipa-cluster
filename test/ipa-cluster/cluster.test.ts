// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (c) 2023 Levi Gruspe

// Test cluster.ts.

import { cluster, Data } from "../../src/ipa-cluster/cluster";
import { levenshtein } from "../../src/ipa-cluster/metrics";

import { strict as assert } from "assert";

describe("cluster", () => {
  it("smoke test", () => {
    const dataset = [{ ipa: "f o o" }, { ipa: "b a r" }, { ipa: "b a z" }];
    const clusters = cluster(dataset, levenshtein);
    clusters.sort((a: Data[], b: Data[]) => a.length - b.length);

    // The clusters should be foo and bar-baz.
    assert.equal(clusters.length, 2);
    assert.deepEqual(clusters[0], [{ ipa: "f o o" }]);
  });
});
