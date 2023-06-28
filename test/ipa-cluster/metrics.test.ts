// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (c) 2023 Levi Gruspe

// Test metrics.ts.

import { levenshtein } from "../../src/ipa-cluster/metrics";

import { strict as assert } from "assert";

import fc from "fast-check";

describe("levenshtein", () => {
  it("should be symmetric", () => {
    fc.assert(
      fc.property(
        fc.tuple(fc.string(), fc.string()),
        (data: [string, string]) => {
          const [s, t] = data;
          assert.equal(levenshtein(s, t), levenshtein(t, s));
        }
      )
    );
  });

  it("should not exceed the length of the longer string", () => {
    fc.assert(
      fc.property(
        fc.tuple(fc.string(), fc.string()),
        (data: [string, string]) => {
          const [s, t] = data;
          assert.ok(levenshtein(s, t) <= Math.max(s.length, t.length));
        }
      )
    );
  });

  it("should satisfy the triangle inequality", () => {
    fc.assert(
      fc.property(
        fc.tuple(fc.string(), fc.string(), fc.string()),
        (data: [string, string, string]) => {
          const [a, b, c] = data;
          assert.ok(levenshtein(a, b) + levenshtein(b, c) >= levenshtein(a, c));
        }
      )
    );
  });

  describe("when one string is empty", () => {
    it("should return the length of the other string", () => {
      fc.assert(
        fc.property(fc.string(), (data: string) => {
          assert.equal(levenshtein(data, ""), data.length);
          assert.equal(levenshtein("", data), data.length);
        })
      );
    });
  });

  describe("when input strings are equal", () => {
    it("should return 0", () => {
      fc.assert(
        fc.property(fc.string(), (data: string) => {
          assert.equal(levenshtein(data, data), 0);
        })
      );
    });
  });

  // Don't delete this test. It's useful for finding off-by-one errors.
  describe("when input strings are the same except for one character", () => {
    it("should return 1", () => {
      fc.assert(
        fc.property(fc.string(), (data: string) => {
          const first = "a" + data;
          const second = "b" + data;
          assert.equal(levenshtein(first, second), 1);
        })
      );
    });
  });
});
