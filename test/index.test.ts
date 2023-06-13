// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (c) 2023 Levi Gruspe

// Test index.ts.

import { strict as assert } from "assert";

describe("index.ts", () => {
  it("should export `parse` from `parser.ts`", async () => {
    const index = await import("../src/index");
    assert.ok(Object.prototype.hasOwnProperty.call(index, "parse"));
  });
});
