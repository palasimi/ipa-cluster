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
    assert.equal(tokenize("# foo")[0].tag, Tag.Terminal);
    assert.equal(tokenize("#foo")[0].tag, Tag.Terminal);
  });

  describe("words", () => {
    describe("if word looks like a variable name", () => {
      it("should be tagged as a variable", () => {
        const examples = [
          "A",
          "B",
          "C",
          "Foo",
          "Bar",
          "Baz",
          "A1",
          "X1",
          "Y2",
          "Z3",
        ];
        for (const example of examples) {
          const tokens = tokenize(example);
          assert.equal(tokens.length, 1);

          const token = tokens[0];
          assert.equal(token.tag, Tag.Variable);
          assert.equal(token.literal, example);
        }
      });
    });

    describe("if word does not look like a variable name", () => {
      it("should be tagged as a terminal", () => {
        const examples = [
          "qwerty",
          "asdf",
          "foo",
          "bar",
          "baz",
          "Aä", // not a variable, because it's not ASCII alphanumeric
        ];
        for (const example of examples) {
          const tokens = tokenize(example);
          assert.equal(tokens.length, 1);

          const token = tokens[0];
          assert.equal(token.tag, Tag.Terminal);
          assert.equal(token.literal, example);
        }
      });
    });

    describe("if word is an IPA segment", () => {
      it("should be tagged as a terminal", () => {
        const examples = [
          // Vowels
          "i",
          "y",
          "ɨ",
          "ʉ",
          "ɯ",
          "u",
          "ɪ",
          "ʏ",
          "ʊ",
          "e",
          "ø",
          "ɘ",
          "ɵ",
          "ɤ",
          "o",
          "e̞",
          "ø̞",
          "ə",
          "ɤ̞",
          "o̞",
          "ɛ",
          "œ",
          "ɜ",
          "ɞ",
          "ʌ",
          "ɔ",
          "æ",
          "ɐ",
          "a",
          "ɶ",
          "ä",
          "ɑ",
          "ɒ",

          // Pulmonic consonants
          "m̥",
          "m",
          "ɱ",
          "n̼",
          "n̥",
          "n",
          "ɳ̊",
          "ɳ",
          "ɲ̊",
          "ɲ",
          "ŋ̊",
          "ŋ",
          "ɴ",
          "p",
          "b",
          "p̪",
          "b̪",
          "t̼",
          "d̼",
          "t",
          "d",
          "ʈ",
          "ɖ",
          "c",
          "ɟ",
          "k",
          "ɡ",
          "q",
          "ɢ",
          "ʡ",
          "ʔ",
          "ts",
          "dz",
          "t̠ʃ",
          "d̠ʒ",
          "tʂ",
          "dʐ",
          "tɕ",
          "dʑ",
          "pɸ",
          "bβ",
          "p̪f",
          "b̪v",
          "t̪θ",
          "d̪ð",
          "tɹ̝̊",
          "dɹ̝",
          "t̠ɹ̠̊˔",
          "d̠ɹ̠˔",
          "cç",
          "ɟʝ",
          "kx",
          "ɡɣ",
          "qχ",
          "ɢʁ",
          "ʡʜ",
          "ʡʢ",
          "ʔh",
          "s",
          "z",
          "ʃ",
          "ʒ",
          "ʂ",
          "ʐ",
          "ɕ",
          "ʑ",
          "ɸ",
          "β",
          "f",
          "v",
          "θ̼",
          "ð̼",
          "θ",
          "ð",
          "θ̠",
          "ð̠",
          "ɹ̠̊˔",
          "ɹ̠˔",
          "ɻ̊˔",
          "ɻ˔",
          "ç",
          "ʝ",
          "x",
          "ɣ",
          "χ",
          "ʁ",
          "ħ",
          "ʕ",
          "h",
          "ɦ",
          "ʋ",
          "ɹ",
          "ɻ",
          "j",
          "ɰ",
          "ʔ̞",
          "ⱱ̟",
          "ⱱ",
          "ɾ̼",
          "ɾ̥",
          "ɾ",
          "ɽ̊",
          "ɽ",
          "ɢ̆",
          "ʡ̆",
          "ʙ̥",
          "ʙ",
          "r̥",
          "r",
          "ɽ̊r̥",
          "ɽr",
          "ʀ̥",
          "ʀ",
          "ʜ",
          "ʢ",
          "tɬ",
          "dɮ",
          "tꞎ",
          "d𝼅",
          "c𝼆",
          "ɟʎ̝",
          "k𝼄",
          "ɡʟ̝",
          "ɬ",
          "ɮ",
          "ꞎ",
          "𝼅",
          "𝼆",
          "ʎ̝",
          "𝼄",
          "ʟ̝",
          "l",
          "ɭ",
          "ʎ",
          "ʟ",
          "ʟ̠",
          "ɺ̥",
          "ɺ",
          "𝼈̥",
          "𝼈",
          "ʎ̆",
          "ʟ̆",

          // Non-pulmonic consonants
          "pʼ",
          "tʼ",
          "ʈʼ",
          "cʼ",
          "kʼ",
          "qʼ",
          "ʡʼ",
          "t̪θʼ",
          "tsʼ",
          "t̠ʃʼ",
          "tʂʼ",
          "kxʼ",
          "qχʼ",
          "ɸʼ",
          "fʼ",
          "θʼ",
          "sʼ",
          "ʃʼ",
          "ʂʼ",
          "ɕʼ",
          "xʼ",
          "χʼ",
          "tɬʼ",
          "c𝼆ʼ",
          "k𝼄ʼ",
          "ɬʼ",
          "kʘ",
          "qʘ",
          "kǀ",
          "qǀ",
          "kǃ",
          "qǃ",
          "k𝼊",
          "q𝼊",
          "kǂ",
          "qǂ",
          "ɡʘ",
          "ɢʘ",
          "ɡǀ",
          "ɢǀ",
          "ɡǃ",
          "ɢǃ",
          "ɡ𝼊",
          "ɢ𝼊",
          "ɡǂ",
          "ɢǂ",
          "ŋʘ",
          "ɴʘ",
          "ŋǀ",
          "ɴǀ",
          "ŋǃ",
          "ɴǃ",
          "ŋ𝼊",
          "ɴ𝼊",
          "ŋǂ",
          "ɴǂ",
          "ʞ",
          "kǁ",
          "qǁ",
          "ɡǁ",
          "ɢǁ",
          "ŋǁ",
          "ɴǁ",
          "ɓ",
          "ɗ",
          "ᶑ",
          "ʄ",
          "ɠ",
          "ʛ",
          "ɓ̥",
          "ɗ̥",
          "ᶑ̊",
          "ʄ̊",
          "ɠ̊",
          "ʛ̥",

          // Co-articulated consonants
          "n͡m",
          "ŋ͡m",
          "t͡p",
          "d͡b",
          "k͡p",
          "ɡ͡b",
          "q͡ʡ",
          "ɥ̊",
          "ɥ",
          "ʍ",
          "w",
          "ɧ",
          "ɫ",

          // Other consonants
          "j̃",
          "w̃",
          "h̃",
          "t̪ʙ̥",
          "h̪͆",

          // Tone registers
          "˥",
          "꜒",
          "˦",
          "꜓",
          "˧",
          "꜔",
          "˨",
          "꜕",
          "˩",
          "꜖",

          // Tone contours
          "˩˥",
          "꜖꜒",
          "˥˩",
          "꜒꜖",
          "˧˥",
          "꜔꜒",
          "˨˦",
          "꜕꜓",
          "˩˧",
          "꜖꜔",
          "˥˧",
          "꜒꜔",
          "˦˨",
          "꜓꜕",
          "˧˩",
          "꜔꜖",
          "˧˥˨",
          "˨˦˨",
          "˩˧˩",
          "꜔꜒꜕",
          "꜕꜓꜕",
          "꜖꜔꜖",
          "˥˧˥",
          "˦˨˦",
          "˧˩˧",
          "꜒꜔꜒",
          "꜓꜕꜓",
          "꜔꜖꜔",
        ];
        for (const example of examples) {
          const tokens = tokenize(example);
          assert.equal(tokens.length, 1);

          const token = tokens[0];
          assert.equal(token.tag, Tag.Terminal);
          assert.equal(token.literal, example);
        }
      });
    });

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
