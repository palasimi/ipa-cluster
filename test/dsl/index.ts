// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (c) 2023 Levi Gruspe
// Test index.ts.

import { strict as assert } from "assert";

describe("index.ts", async () => {
  const index = await import("../../src/dsl/index");

  it("should export `compile` from `compiler.ts`", () => {
    assert.ok(Object.prototype.hasOwnProperty.call(index, "compile"));
  });

  it("should export `Querier` from `compiler.ts`", () => {
    assert.ok(Object.prototype.hasOwnProperty.call(index, "Querier"));
  });

  it("should export `ParseError` from `parser.ts`", () => {
    assert.ok(Object.prototype.hasOwnProperty.call(index, "ParseError"));
  });
});
