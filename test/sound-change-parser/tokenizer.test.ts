// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (c) 2023 Levi Gruspe

// Test tokenizer.ts.

import { tokenize } from "../../src/sound-change-parser/tokenizer";

import { strict as assert } from "assert";

describe("tokenize", () => {
  it("should insert a new line at the end", () => {
    assert.deepEqual(["\n"], Array.from(tokenize("")));
    assert.deepEqual(["foo", "\n"], Array.from(tokenize("foo")));
  });

  it("should ignore comments", () => {
    assert.deepEqual(["\n"], Array.from(tokenize("-- test")));
    assert.deepEqual(["\n"], Array.from(tokenize("--test")));

    const code = `
			foo -- footest
			bar
			-- bartest
			baz
			--baztest
		`;
    const expected = [
      "\n",
      "foo",
      "\n",
      "bar",
      "\n",
      "\n",
      "baz",
      "\n",
      "\n",
      "\n",
    ];
    assert.deepEqual(expected, Array.from(tokenize(code)));
  });

  it("should not treat '#' as the start of a comment", () => {
    // Because "#" represents a boundary.
    assert.deepEqual(["#", "foo", "\n"], Array.from(tokenize("# foo")));
    assert.deepEqual(["#foo", "\n"], Array.from(tokenize("#foo")));
  });
});
