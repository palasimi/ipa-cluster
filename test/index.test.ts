// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (c) 2023 Levi Gruspe

import { Data } from "../src/ipa-cluster/cluster";

import { clusterByIPA } from "../src/index";

import { strict as assert } from "assert";

describe("clusterByIPA", () => {
  const dataset = [{ ipa: "q w e" }, { ipa: "a s d" }, { ipa: "z x c" }];

  describe("without ignores", () => {
    it("should penalize unequal IPA segments", () => {
      const clusters = clusterByIPA(dataset, { epsilon: 2 });
      assert.equal(clusters.length, 3);
    });
  });

  describe("with ignores", () => {
    it("should not penalize edits specified in the ruleset", () => {
      const ignores = `
        -- Sound changes work like types of edits to ignore.
        q -> a
        w -> s
        e -> d
      `;
      const clusters = clusterByIPA(dataset, { ignores, epsilon: 2 });
      clusters.sort((a: Data[], b: Data[]) => a.length - b.length);

      // The ignore list is written to cause "qwe" and "asd" to be clustered
      // together.
      assert.equal(clusters.length, 2);
      assert.deepEqual(clusters[0], [{ ipa: "z x c" }]);
    });
  });

  it("should return the same values from the input", () => {
    const dataset = [
      { id: 0, ipa: "q w e" },
      { id: 1, ipa: "a s d" },
      { id: 2, ipa: "z x c" },
    ];
    const clusters = clusterByIPA(dataset, { epsilon: 0 });

    assert.equal(clusters.length, 3);
    const results = new Map();
    for (const cluster of clusters) {
      for (const data of cluster) {
        results.set(data.id, data);
      }
    }

    for (const data of dataset) {
      assert.equal(data, results.get(data.id));
    }
  });
});
