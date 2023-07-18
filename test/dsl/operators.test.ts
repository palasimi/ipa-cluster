// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (c) 2023 Levi Gruspe
// Test operators.ts.

import { concatenate } from "../../src/dsl/operators";

import { strict as assert } from "assert";

describe("concatenate", () => {
  describe("two empty sounds", () => {
    it("should return one empty sequence", () => {
      const result = concatenate([], []);
      assert.deepEqual(result, [[]]);
    });
  });

  describe("a segment and an empty sound", () => {
    it("should return one segment", () => {
      const a = concatenate(["a"], []);
      const b = concatenate([], ["a"]);

      const expected = [["a"]];
      assert.deepEqual(a, expected);
      assert.deepEqual(b, expected);
    });
  });

  describe("two segments", () => {
    it("should return one sequence with the concatenation of the two segments", () => {
      assert.deepEqual(concatenate(["a"], ["b"]), [["a", "b"]]);
    });
  });

  describe("with multiple sounds", () => {
    it("smoke test", () => {
      assert.deepEqual(concatenate(["a"], [], ["c", "d"]), [
        ["a", "c"],
        ["a", "d"],
      ]);
    });
  });
});
