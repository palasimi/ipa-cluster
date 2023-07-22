// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (c) 2023 Levi Gruspe
// Test trie.ts.

import { Trie } from "../../src/dsl/trie";

import fc from "fast-check";

import { strict as assert } from "assert";

describe("Trie", () => {
  describe("with no accept states", () => {
    it("should reject everything", () => {
      const trie = new Trie();

      fc.assert(
        fc.property(fc.array(fc.string()), (segments) => {
          assert.ok(!trie.test(segments));
        })
      );
    });
  });

  describe("with root as accept state", () => {
    it("should accept everything", () => {
      const trie = new Trie();
      trie.add([]);

      fc.assert(
        fc.property(fc.array(fc.string()), (segments) => {
          assert.ok(trie.test(segments));
        })
      );
    });
  });

  it("should reject inputs if the language is incorrect", () => {
    fc.assert(
      fc.property(fc.array(fc.string()), (segments) => {
        const trie = new Trie();
        trie.add(segments, "en");
        assert.ok(!trie.test(segments, "de"));
      })
    );
  });

  it("should not contain '_' transitions in added sequences", () => {
    const trie = new Trie();

    // Suffix
    trie.add(["a", "_"]);
    assert.ok(trie.test(["a"]));
    assert.ok(trie.test(["a", "_"]));

    // Prefix
    trie.add(["_", "b"]);
    assert.ok(trie.test(["b"]));
    assert.ok(!trie.test(["_", "b"]));
  });
});
