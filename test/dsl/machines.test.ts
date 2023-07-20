// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (c) 2023 Levi Gruspe
// Test machines.ts.

import { AcyclicMachine } from "../../src/dsl/machines";

import fc from "fast-check";

import { strict as assert } from "assert";

describe("AcyclicMachine", () => {
  describe("with no transitions", () => {
    it("should reject everything", () => {
      const machine = new AcyclicMachine();

      fc.assert(
        fc.property(fc.array(fc.string()), (segments) => {
          assert.ok(!machine.test(segments));
        })
      );
    });
  });

  it("should not contain '_' transitions", () => {
    const machine = new AcyclicMachine();

    // Suffix
    machine.add(["a", "_"]);
    assert.ok(machine.test(["a"]));
    assert.ok(machine.test(["a", "_"]));

    // Prefix
    machine.add(["_", "b"]); // "_" is treated like null
    assert.ok(machine.test(["b"]));
    assert.ok(!machine.test(["_", "b"])); // "_" is not treated like null
  });
});
