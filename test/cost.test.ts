// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (c) 2023 Levi Gruspe

import { createCostFunction } from "../src/cost";
import { cluster, Data } from "../src/ipa-cluster/cluster";
import { levenshtein } from "../src/ipa-cluster/metrics";

import { strict as assert } from "assert";

describe("createCostFunction", () => {
  const dataset = [{ ipa: "q w e" }, { ipa: "a s d" }, { ipa: "z x c" }];

  describe("without ignores", () => {
    it("smoke test", () => {
      const cost = createCostFunction("");
      const metric = (a: string[], b: string[]) => levenshtein(a, b, cost);
      const clusters = cluster(dataset, metric);

      assert.equal(clusters.length, 3);
    });
  });

  describe("with ignores", () => {
    it("smoke test", () => {
      const code = `
        -- Sound changes work like types of edits to ignore.
        q -> a
        w -> s
        e -> d
      `;
      const cost = createCostFunction(code);
      const metric = (a: string[], b: string[]) => levenshtein(a, b, cost);
      const clusters = cluster(dataset, metric);

      clusters.sort((a: Data[], b: Data[]) => a.length - b.length);

      // The code is written to cause "qwe" and "asd" to be clustered together.
      assert.equal(clusters.length, 2);
      assert.deepEqual(clusters[0], [{ ipa: "z x c" }]);
    });
  });
});
