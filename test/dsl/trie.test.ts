// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (c) 2023 Levi Gruspe
// Test trie.ts.

import { Trie } from "../../src/dsl/trie";

import fc from "fast-check";

import { strict as assert } from "assert";

describe("Trie", () => {
  describe("with no transitions", () => {
    it("should reject everything", () => {
      const trie = new Trie();

      fc.assert(
        fc.property(fc.array(fc.string()), (segments) => {
          assert.ok(!trie.test(segments));
        })
      );
    });
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
