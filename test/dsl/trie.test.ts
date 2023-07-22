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

  it("should only accept sequences that have been added", () => {
    const exclude = /_| /;

    fc.assert(
      fc.property(
        fc.uniqueArray(
          fc
            .array(fc.string().filter((s) => s.length > 0 && !exclude.test(s)))
            .map((a) => a.join(" "))
        ),
        (examples) => {
          // Testing strategy: we'll only add sequences at even indices.
          const even = [];
          const odd = [];
          for (const [i, example] of examples.entries()) {
            if (i % 2 === 0) {
              even.push(example.split(" "));
            } else {
              odd.push(example.split(" "));
            }
          }

          const trie = new Trie();
          for (const example of even) {
            trie.add(example);
          }

          // Even examples should be accepted, while odd examples (those that
          // weren't added) should be rejected.
          for (const example of even) {
            assert.ok(trie.test(example));
          }
          for (const example of odd) {
            assert.ok(!trie.test(example));
          }
        }
      )
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
