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
});
