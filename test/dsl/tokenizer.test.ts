// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (c) 2023 Levi Gruspe
// Test tokenizer.ts.

import { Tag, Token, tokenize } from "../../src/dsl/tokenizer";

import { strict as assert } from "assert";

/**
 * Extract literals from results of `tokenize()`.
 */
function literals(tokens: Token[]): string[] {
  return tokens.map((token) => token.literal);
}

describe("tokenize", () => {
  it("should not insert spurious new lines at the end", () => {
    assert.deepEqual([], literals(tokenize("")));
    assert.deepEqual(["foo"], literals(tokenize("foo")));
  });

  it("should preserve new lines in code", () => {
    assert.deepEqual(["\n"], literals(tokenize("\n")));
    assert.deepEqual(["foo", "\n"], literals(tokenize("foo\n")));
  });

  it("should ignore comments", () => {
    assert.deepEqual([], literals(tokenize("-- test")));
    assert.deepEqual([], literals(tokenize("--test")));
    assert.deepEqual([], literals(tokenize(" -- test")));
    assert.deepEqual([], literals(tokenize("  --test")));

    const code = `
      foo -- footest
      bar
      -- bartest
      baz
      -- baztest
    `;
    const expected = ["\n", "foo", "\n", "bar", "\n", "\n", "baz", "\n", "\n"];
    const tokens = tokenize(code);
    assert.deepEqual(expected, literals(tokens));
  });

  it("should not treat '#' as the start of a comment", () => {
    assert.strictEqual(tokenize("# foo")[0].tag, Tag.Terminal);
    assert.strictEqual(tokenize("#foo")[0].tag, Tag.Terminal);
  });

  describe("words", () => {
    it("should break words at reserved symbols", () => {
      const examples: Array<[string, string[]]> = [
        ["!foo!bar!baz!", ["!", "foo", "!", "bar", "!", "baz", "!"]],
        ["$foo$bar$baz$", ["$", "foo", "$", "bar", "$", "baz", "$"]],
        ["%foo%bar%baz%", ["%", "foo", "%", "bar", "%", "baz", "%"]],
        ["&foo&bar&baz&", ["&", "foo", "&", "bar", "&", "baz", "&"]],
        ["'foo'bar'baz'", ["'", "foo", "'", "bar", "'", "baz", "'"]],
        ["(foo(bar(baz(", ["(", "foo", "(", "bar", "(", "baz", "("]],
        [")foo)bar)baz)", [")", "foo", ")", "bar", ")", "baz", ")"]],
        ["*foo*bar*baz*", ["*", "foo", "*", "bar", "*", "baz", "*"]],
        ["+foo+bar+baz+", ["+", "foo", "+", "bar", "+", "baz", "+"]],
        [",foo,bar,baz,", [",", "foo", ",", "bar", ",", "baz", ","]],
        ["-foo-bar-baz-", ["-", "foo", "-", "bar", "-", "baz", "-"]],
        [":foo:bar:baz:", [":", "foo", ":", "bar", ":", "baz", ":"]],
        [";foo;bar;baz;", [";", "foo", ";", "bar", ";", "baz", ";"]],
        ["<foo<bar<baz<", ["<", "foo", "<", "bar", "<", "baz", "<"]],
        [">foo>bar>baz>", [">", "foo", ">", "bar", ">", "baz", ">"]],
        ["?foo?bar?baz?", ["?", "foo", "?", "bar", "?", "baz", "?"]],
        ["@foo@bar@baz@", ["@", "foo", "@", "bar", "@", "baz", "@"]],
        ["[foo[bar[baz[", ["[", "foo", "[", "bar", "[", "baz", "["]],
        ["\\foo\\bar\\baz\\", ["\\", "foo", "\\", "bar", "\\", "baz", "\\"]],
        ["]foo]bar]baz]", ["]", "foo", "]", "bar", "]", "baz", "]"]],
        ["^foo^bar^baz^", ["^", "foo", "^", "bar", "^", "baz", "^"]],
        ["`foo`bar`baz`", ["`", "foo", "`", "bar", "`", "baz", "`"]],
        ['"foo"bar"baz"', ['"', "foo", '"', "bar", '"', "baz", '"']],
      ];

      for (const [example, expected] of examples) {
        assert.deepEqual(literals(tokenize(example)), expected);
      }
    });

    it("should break words at separators", () => {
      const examples: Array<[string, string[]]> = [
        [".foo.bar.baz.", [".", "foo", ".", "bar", ".", "baz", "."]],
        ["/foo/bar/baz/", ["/", "foo", "/", "bar", "/", "baz", "/"]],
        ["=foo=bar=baz=", ["=", "foo", "=", "bar", "=", "baz", "="]],
        ["\nfoo\nbar\nbaz\n", ["\n", "foo", "\n", "bar", "\n", "baz", "\n"]],
        ["{foo{bar{baz{", ["{", "foo", "{", "bar", "{", "baz", "{"]],
        ["|foo|bar|baz|", ["|", "foo", "|", "bar", "|", "baz", "|"]],
        ["}foo}bar}baz}", ["}", "foo", "}", "bar", "}", "baz", "}"]],
        ["~foo~bar~baz~", ["~", "foo", "~", "bar", "~", "baz", "~"]],
      ];
      for (const [example, expected] of examples) {
        assert.deepEqual(literals(tokenize(example)), expected);
      }
    });

    it("should break words at '#'", () => {
      assert.deepEqual(literals(tokenize("#foo#bar#baz#")), [
        "#",
        "foo",
        "#",
        "bar",
        "#",
        "baz",
        "#",
      ]);
    });

    it("should break words at '_'", () => {
      assert.deepEqual(literals(tokenize("_foo_bar_baz_")), [
        "_",
        "foo",
        "_",
        "bar",
        "_",
        "baz",
        "_",
      ]);
    });
  });
});
