// Test index.ts.

import { strict as assert } from "assert";

describe("index.ts", () => {
  it("should export `parse` from `parser.ts`", async () => {
    const index = await import("../src/index");
    assert.ok(Object.prototype.hasOwnProperty.call(index, "parse"));
  });
});
