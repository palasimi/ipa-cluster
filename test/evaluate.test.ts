// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (c) 2023 Levi Gruspe

// Test evaluate.ts.

import { toQuerier } from "../src/evaluate";
import { parse } from "../src/parser";

import { strict as assert } from "assert";

describe("toQuerier", () => {
  it("basic test", () => {
    const code = "o -> u";
    const tree = parse(code);
    const fn = toQuerier(tree);

    assert.ok(fn("o", "u"));
    assert.ok(fn("u", "o"));

    assert.ok(!fn("o", "e"));
  });

  it("class test", () => {
    const code = "{ a b } -> { d e f }";
    const tree = parse(code);
    const fn = toQuerier(tree);

    for (const left of ["a", "b"]) {
      for (const right of ["d", "e", "f"]) {
        assert.ok(fn(left, right));
        assert.ok(fn(right, left));
      }
    }
  });
});
