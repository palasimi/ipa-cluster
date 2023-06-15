// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (c) 2023 Levi Gruspe

// Test cluster.ts.

import { cluster, Data, Point } from "../../src/ipa-cluster/cluster";
import { levenshtein } from "../../src/ipa-cluster/metrics";

import { strict as assert } from "assert";

describe("cluster", () => {
  it("smoke test", () => {
    const dataset = [{ ipa: "f o o" }, { ipa: "b a r" }, { ipa: "b a z" }];
    const metric = (p: Point, q: Point) => levenshtein(p.ipa, q.ipa);
    const clusters = cluster(dataset, metric);
    clusters.sort((a: Data[], b: Data[]) => a.length - b.length);

    // The clusters should be foo and bar-baz.
    assert.equal(clusters.length, 2);
    assert.deepEqual(clusters[0], [{ ipa: "f o o" }]);
  });
});
