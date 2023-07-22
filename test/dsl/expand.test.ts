// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (c) 2023 Levi Gruspe
// Test expand.ts.

import { expand } from "../../src/dsl/expand";
import { parse } from "../../src/dsl/parser";
import { squash } from "../../src/dsl/squash";

import { strict as assert } from "assert";

describe("expand", () => {
  it("should expand rules with unions into multiple rules", () => {
    const code = "{a o}~{}";
    const ir = expand(squash(parse(code)));

    const constraint = { left: "_", right: "_" };
    assert.deepEqual(ir, {
      rules: [
        {
          constraint,
          left: ["a"],
          right: [],
        },
        {
          constraint,
          left: ["o"],
          right: [],
        },
      ],
    });
  });

  it("should remove word boundaries in the middle of a sequence", () => {
    const code = `
      a # b ~ c
      a ~ b # c
      a ~ b / c # d _ e
      a ~ b / c _ d # e
    `;
    const ir = expand(squash(parse(code)));

    const constraint = { left: "_", right: "_" };
    assert.deepEqual(ir, {
      rules: [
        {
          constraint,
          left: ["a", "b"],
          right: ["c"],
        },
        {
          constraint,
          left: ["a"],
          right: ["b", "c"],
        },
        {
          constraint,
          left: ["c", "d", "a", "e"],
          right: ["c", "d", "b", "e"],
        },
        {
          constraint,
          left: ["c", "a", "d", "e"],
          right: ["c", "b", "d", "e"],
        },
      ],
    });
  });

  it("should remove redundant word boundaries", () => {
    const code = `
      a ~ b / # # _
      a ~ b/ _ # #
    `;
    const ir = expand(squash(parse(code)));

    const constraint = { left: "_", right: "_" };
    assert.deepEqual(ir, {
      rules: [
        {
          constraint,
          left: ["#", "a"],
          right: ["#", "b"],
        },
        {
          constraint,
          left: ["a", "#"],
          right: ["b", "#"],
        },
      ],
    });
  });

  it("should not remove significant word boundaries", () => {
    const codeA = `
      # a ~ # b
      a # ~ b #
      # a # ~ # b #
    `;
    const codeB = `
      a ~ b / # _
      a ~ b / _ #
      a ~ b / # _ #
    `;
    const irA = expand(squash(parse(codeA)));
    const irB = expand(squash(parse(codeB)));

    const constraint = { left: "_", right: "_" };
    const expected = {
      rules: [
        {
          constraint,
          left: ["#", "a"],
          right: ["#", "b"],
        },
        {
          constraint,
          left: ["a", "#"],
          right: ["b", "#"],
        },
        {
          constraint,
          left: ["#", "a", "#"],
          right: ["#", "b", "#"],
        },
      ],
    };

    assert.deepEqual(irA, irB);
    assert.deepEqual(irA, expected);
  });
});
