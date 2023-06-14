// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (c) 2023 Levi Gruspe

// Test index.ts.

import { strict as assert } from "assert";

describe("index.ts", async () => {
  const index = await import("../../src/sound-change-parser/index");

  it("should export `parse` from `parser.ts`", () => {
    assert.ok(Object.prototype.hasOwnProperty.call(index, "parse"));
  });

  it("should export `toQuerier` from `evaluate.ts`", () => {
    assert.ok(Object.prototype.hasOwnProperty.call(index, "toQuerier"));
  });
});
