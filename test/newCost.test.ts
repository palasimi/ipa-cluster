// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (c) 2023 Levi Gruspe
// Test newCost.ts.

import { createCostFunction } from "../src/newCost";
import { levenshtein } from "../src/ipa-cluster/metrics";

import { strict as assert } from "assert";

describe("new createCostFunction", () => {
  describe("return value", () => {
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
      assert.equal(levenshtein(first, second), 3);

      // With the cost function, the two sequences should be considered equal.
      assert.equal(levenshtein(first, second, cost), 0);
    });

    it("example: deleted middle sound #1", () => {
      const code = "";
      const cost = createCostFunction(code);

      const first = ["a", "b", "c"];
      const second = ["a", "c"];

      assert.equal(levenshtein(first, second), 1);
      assert.equal(levenshtein(first, second, cost), 1);
    });

    it("example: deleted middle sound #2", () => {
      const code = `
        a ~ x
        b ~ y
        c ~ z
      `;
      const cost = createCostFunction(code);

      const first = ["a", "b", "c"];
      const second = ["a", "c"];

      assert.equal(levenshtein(first, second), 1);
      assert.equal(levenshtein(first, second, cost), 1);
    });

    it("example: no code", () => {
      const code = "";
      const cost = createCostFunction(code);

      const first: string[] = [];
      const second = ["a", "b", "c"];

      assert.equal(levenshtein(first, second), 3);
      assert.equal(levenshtein(first, second, cost), 3);
    });

    it("example: replace one segment with two #1", () => {
      const code = "hm ~ h m";
      const cost = createCostFunction(code);

      const first = ["l", "e", "hm"];
      const second = ["l", "e", "h", "m"];
      const third = ["l", "e", "h", "m", "æ"];

      assert.equal(levenshtein(first, second), 2);
      assert.equal(levenshtein(first, second, cost), 0);

      assert.equal(levenshtein(second, third), 1);
      assert.equal(levenshtein(second, third, cost), 1);

      assert.equal(levenshtein(first, third), 3);
      assert.equal(levenshtein(first, third, cost), 1);
    });

    it("example: replace one segment with two #2", () => {
      const code = "a b ~ ab";
      const cost = createCostFunction(code);

      const first = ["a", "b"];
      const second = ["ab"];

      assert.equal(levenshtein(first, second), 2);
      assert.equal(levenshtein(first, second, cost), 0);

      const third = ["a", "b", "c"];
      const fourth = ["ab", "c"];

      assert.equal(levenshtein(third, fourth), 2);
      assert.equal(levenshtein(third, fourth, cost), 0);
    });

    it("example: substitution", () => {
      const code = "a ~ ɐ";
      const cost = createCostFunction(code);

      const first = ["a", "l", "e", "ɡ", "ɾ", "i", "a"];
      const second = ["a", "l", "e", "ɡ", "ɾ", "i", "ɐ"];
      const third = ["a", "l", "i", "ɡ", "ɾ", "i", "ɐ"];

      assert.equal(levenshtein(first, second), 1);
      assert.equal(levenshtein(first, second, cost), 0);

      assert.equal(levenshtein(second, third), 1);
      assert.equal(levenshtein(second, third, cost), 1);

      assert.equal(levenshtein(first, third), 2);
      assert.equal(levenshtein(first, third, cost), 1);
    });
  });
});
