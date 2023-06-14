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
});
