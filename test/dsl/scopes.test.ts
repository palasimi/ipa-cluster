// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (c) 2023 Levi Gruspe
// Test scopes.ts.

import { Scope } from "../../src/dsl/scopes";

import fc from "fast-check";

import { strict as assert } from "assert";

/**
 * Returns arbitrary values for testing.
 */
function anyValue() {
  return fc.oneof(
    fc.anything(),
    fc.boolean(),
    fc.date(),
    fc.float(),
    fc.integer(),
    fc.string()
  );
}

/**
 * Returns arbitrary name-value pairs for testing.
 */
function nameValue() {
  return fc.tuple(fc.string(), anyValue());
}

describe("Scope", () => {
  describe("constructor", () => {
    it("should have no pre-defined names", () => {
      const outer = new Scope();
      const inner = new Scope(outer);

      assert.equal(outer.names.size, 0);
      assert.equal(inner.names.size, 0);
    });

    it("should set `outer` attribute", () => {
      const grandparent = new Scope();
      const parent = new Scope(grandparent);
      const child = new Scope(parent);

      assert.ok(grandparent.outer === null);
      assert.equal(parent.outer, grandparent);
      assert.equal(child.outer, parent);
    });
  });

  describe("define", () => {
    describe("when variable is not yet defined", () => {
      it("should return true (success)", () => {
        fc.assert(
          fc.property(nameValue(), ([name, value]) => {
            const scope = new Scope();
            assert.ok(scope.define(name, value));
          })
        );
      });

      it("should set the variable to the assigned value", () => {
        fc.assert(
          fc.property(nameValue(), ([name, value]) => {
            const scope = new Scope();
            scope.define(name, value);
            assert.equal(scope.resolve(name), value);
          })
        );
      });
    });

    describe("when variable is already defined in the current scope", () => {
      it("should return false", () => {
        fc.assert(
          fc.property(nameValue(), ([name, value]) => {
            const scope = new Scope();
            scope.define(name, value);
            assert.ok(!scope.define(name, value));
          })
        );
      });

      it("should not overwrite the previous value", () => {
        fc.assert(
          fc.property(
            fc.tuple(
              fc.string(),
              fc.integer({ max: -1 }),
              fc.integer({ min: 1 })
            ),
            ([name, value1, value2]) => {
              const scope = new Scope();
              scope.define(name, value1);
              scope.define(name, value2);
              assert.equal(scope.resolve(name), value1);
            }
          )
        );
      });
    });

    describe("when shadowing", () => {
      it("should be okay", () => {
        fc.assert(
          fc.property(
            fc.tuple(fc.string(), anyValue(), anyValue()),
            ([name, outerValue, innerValue]) => {
              const outer = new Scope();
              const inner = new Scope(outer);

              outer.define(name, outerValue);
              assert.ok(inner.define(name, innerValue));
            }
          )
        );
      });

      it("should not overwrite variables in parent scopes", () => {
        fc.assert(
          fc.property(
            fc.tuple(fc.string(), anyValue(), anyValue()),
            ([name, outerValue, innerValue]) => {
              const outer = new Scope();
              const inner = new Scope(outer);

              outer.define(name, outerValue);
              assert.ok(inner.define(name, innerValue));
              assert.equal(inner.resolve(name), innerValue);
              assert.equal(outer.resolve(name), outerValue);
            }
          )
        );
      });
    });
  });

  describe("resolve", () => {
    describe("when variable is not defined in any scope", () => {
      it("should throw `NameError`", () => {
        const scope = new Scope();
        assert.throws(() => scope.resolve("foo"), {
          name: "NameError",
          message: /foo.*not defined/,
        });
      });
    });

    describe("when variable is not defined in the current scope", () => {
      it("should look in parent scopes", () => {
        fc.assert(
          fc.property(nameValue(), ([name, value]) => {
            const outer = new Scope();
            outer.define(name, value);

            const inner = new Scope(outer);

            assert.ok(!inner.names.has(name));
            assert.equal(inner.resolve(name), value);
          })
        );
      });
    });
  });
});
