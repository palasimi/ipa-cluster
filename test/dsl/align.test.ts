// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (c) 2023 Levi Gruspe
// Test align.ts.

import { align } from "../../src/dsl/align";
import { expand } from "../../src/dsl/expand";
import { parse } from "../../src/dsl/parser";
import { squash } from "../../src/dsl/squash";

import fc from "fast-check";

import { strict as assert } from "assert";

describe("align", () => {
  describe("with empty sequence", () => {
    it("should turn the shorter sequence into a sequence of '_'s", () => {
      const code = "a b c ~ {}";
      const ir = align(expand(squash(parse(code))));
      assert.deepEqual(ir, {
        rules: [
          {
            constraint: { left: "_", right: "_" },
            left: ["a", "b", "c"],
            right: ["_", "_", "_"],
          },
        ],
      });
    });
  });

  describe("sequences of the same length", () => {
    it("should return the input unmodified", () => {
      fc.assert(
        fc.property(fc.array(fc.string()), (sequence) => {
          const constraint = { left: "_", right: "_" };
          const ir = {
            rules: [
              {
                constraint,
                left: sequence,
                right: sequence,
              },
            ],
          };
          const result = align(ir);
          assert.deepEqual(ir, result);
        })
      );
    });
  });

  describe("when aligning beyond '#'", () => {
    it("should pad shorter sequence with '#'s", () => {
      const code = "a b # ~ a #";
      const ir = align(expand(squash(parse(code))));
      const constraint = { left: "_", right: "_" };
      assert.deepEqual(ir, {
        rules: [
          {
            constraint,
            left: ["a", "b", "#"],
            right: ["a", "#", "#"],
          },
        ],
      });
    });
  });

  describe("when both sides of a rule share some segments", () => {
    it("should add left padding to optimize alignment", () => {
      const code = `
        a b c ~ a
        a b c ~ b
        a b c ~ c
      `;
      const ir = align(expand(squash(parse(code))));
      const constraint = { left: "_", right: "_" };
      assert.deepEqual(ir, {
        rules: [
          {
            constraint,
            left: ["a", "b", "c"],
            right: ["a", "_", "_"],
          },
          {
            constraint,
            left: ["a", "b", "c"],
            right: ["_", "b", "_"],
          },
          {
            constraint,
            left: ["a", "b", "c"],
            right: ["_", "_", "c"],
          },
        ],
      });
    });
  });

  it("should add padding so both sides of a rule have the same length", () => {
    const code = `
      a ~ {}
      a ~ b c
      a b c ~ d e
    `;
    const ir = align(expand(squash(parse(code))));
    const constraint = { left: "_", right: "_" };
    assert.deepEqual(ir, {
      rules: [
        {
          constraint,
          left: ["a"],
          right: ["_"],
        },
        {
          constraint,
          left: ["a", "_"],
          right: ["b", "c"],
        },
        {
          constraint,
          left: ["a", "b", "c"],
          right: ["d", "e", "_"],
        },
      ],
    });
  });
});
