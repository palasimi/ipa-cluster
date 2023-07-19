// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (c) 2023 Levi Gruspe
// Test align.ts.

import { align } from "../../src/dsl/align";
import { expand } from "../../src/dsl/expand";
import { parse } from "../../src/dsl/parser";
import { squash } from "../../src/dsl/squash";

import { strict as assert } from "assert";

describe("align", () => {
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
