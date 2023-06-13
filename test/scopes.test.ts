// Test scopes.ts.

import { Scope } from "../src/scopes";
import { SegmentSound } from "../src/tree";

import { strict as assert } from "assert";

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
      it("should return true", () => {
        const scope = new Scope();
        assert.ok(scope.define("foo", { type: "segment", value: "m" }));
      });

      it("should set the variable to the assigned value", () => {
        const scope = new Scope();
        const sound: SegmentSound = { type: "segment", value: "m" };
        scope.define("foo", sound);

        assert.deepEqual(scope.resolve("foo"), sound);
      });
    });

    describe("when variable is already defined in the current scope", () => {
      it("should return false", () => {
        const scope = new Scope();
        scope.define("foo", { type: "segment", value: "m" });
        assert.ok(!scope.define("foo", { type: "segment", value: "n" }));
      });

      it("should not overwrite the previous value", () => {
        const scope = new Scope();
        const sound: SegmentSound = { type: "segment", value: "m" };
        scope.define("foo", sound);
        scope.define("foo", { type: "segment", value: "n" });

        assert.equal(scope.resolve("foo"), sound);
      });
    });

    describe("when shadowing", () => {
      it("should be okay", () => {
        const outer = new Scope();
        const inner = new Scope(outer);

        outer.define("foo", { type: "segment", value: "m" });
        assert.ok(inner.define("foo", { type: "segment", value: "n" }));
      });

      it("should not overwrite variables in parent scopes", () => {
        const outer = new Scope();
        const inner = new Scope(outer);

        const outerSound: SegmentSound = { type: "segment", value: "m" };
        const innerSound: SegmentSound = { type: "segment", value: "n" };

        outer.define("foo", outerSound);
        assert.ok(inner.define("foo", innerSound));

        assert.notDeepEqual(innerSound, outerSound);
        assert.deepEqual(inner.resolve("foo"), innerSound);
        assert.deepEqual(outer.resolve("foo"), outerSound);
      });
    });
  });

  describe("resolve", () => {
    describe("when variable is not defined in any scope", () => {
      it("should return an error value", () => {
        const scope = new Scope();
        const sound = scope.resolve("foo");
        assert.equal(sound.type, "error");
      });
    });

    describe("when variable is not defined in the current scope", () => {
      it("should look in parent scopes", () => {
        const outer = new Scope();
        const sound: SegmentSound = { type: "segment", value: "m" };
        outer.define("foo", sound);

        const inner = new Scope(outer);

        assert.ok(!inner.names.has("foo"));
        assert.deepEqual(inner.resolve("foo"), sound);
      });
    });
  });
});
