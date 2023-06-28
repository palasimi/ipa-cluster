// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (c) 2023 Levi Gruspe

// Test cluster.ts.

import { cluster, Data, Point } from "../../src/ipa-cluster/cluster";
import { levenshtein } from "../../src/ipa-cluster/metrics";

import { strict as assert } from "assert";

import fc from "fast-check";

describe("cluster", () => {
  it("smoke test", () => {
    const dataset = [{ ipa: "f o o" }, { ipa: "b a r" }, { ipa: "b a z" }];
    const metric = (p: Point, q: Point) => levenshtein(p.ipa, q.ipa);
    const clusters = cluster(dataset, metric, { epsilon: 2 });
    clusters.sort((a: Data[], b: Data[]) => a.length - b.length);

    // The clusters should be foo and bar-baz.
    assert.equal(clusters.length, 2);
    assert.deepEqual(clusters[0], [{ ipa: "f o o" }]);
  });

  it("should assign every word to a cluster", () => {
    const metric = (p: Point, q: Point) => levenshtein(p.ipa, q.ipa);
    const options = { maxLength: 10 };

    fc.assert(
      fc.property(
        fc.array(fc.array(fc.unicode(), options), options),
        (ipas: string[][]) => {
          const dataset = ipas.map((tokens) => {
            return { ipa: tokens.join(" ") };
          });
          const clusters = cluster(dataset, metric);

          // Make sure all data points are assigned to a cluster.
          let total = 0;
          for (const cluster of clusters) {
            total += cluster.length;
          }
          assert.equal(total, ipas.length);
        }
      )
    );
  });
});
