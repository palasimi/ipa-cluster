// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (c) 2023 Levi Gruspe

import { Data } from "../src/ipa-cluster/cluster";

import { clusterByIPA } from "../src/index";

import { strict as assert } from "assert";

describe("clusterByIPA", () => {
  const dataset = [{ ipa: "q w e" }, { ipa: "a s d" }, { ipa: "z x c" }];

  describe("without ignores", () => {
    it("should penalize unequal IPA segments", () => {
      const clusters = clusterByIPA(dataset, "");
      assert.equal(clusters.length, 3);
    });
  });

  describe("with ignores", () => {
    it("should not penalize edits specified in the ruleset", () => {
      const code = `
        -- Sound changes work like types of edits to ignore.
        q -> a
        w -> s
        e -> d
      `;
      const clusters = clusterByIPA(dataset, code);
      clusters.sort((a: Data[], b: Data[]) => a.length - b.length);

      // The code is written to cause "qwe" and "asd" to be clustered together.
      assert.equal(clusters.length, 2);
      assert.deepEqual(clusters[0], [{ ipa: "z x c" }]);
    });
  });
});
