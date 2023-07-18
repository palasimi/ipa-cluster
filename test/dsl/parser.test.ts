// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (c) 2023 Levi Gruspe

// Test parser.ts.

import { createTerminalSound, SoundTag } from "../../src/dsl/ir";
import { parse, Parser } from "../../src/dsl/parser";

import { strict as assert } from "assert";

describe("parse", () => {
  describe("rules", () => {
    describe("with empty side", () => {
      it("should be okay", () => {
        const code = `
          ~
          a ~
          ~ b
        `;
        parse(code);
      });
    });
  });

  describe("variable assignments", () => {
    describe("with redefined variable", () => {
      it("should be an error", () => {
        const code = `
          A = a
          A = b
        `;
        assert.throws(() => parse(code), {
          name: "ParseError",
          message: /cannot redefine the variable/,
        });
      });
    });

    describe("with shadowed variable", () => {
      it("should be okay", () => {
        const code = `
          A = a

          en.
          | A = b
          | A ~ b
        `;
        parse(code);
      });
    });

    it("should parse assignment statements", () => {
      // The result is empty, because assignment statements don't produce
      // rulesets.
      assert.deepEqual(parse("A = a").rulesets, []);
      assert.deepEqual(parse("A = { a e i o u }").rulesets, []);
    });

    it("should resolve variable names during parsing", () => {
      const codeA = `
        A={b d g}
        B={p t k}
        A~B/_#
      `;

      const codeB = "{ b d g } ~ { p t k } / _ #";

      // The examples above should produce the same intermediate representation.
      const irA = parse(codeA);
      const irB = parse(codeB);
      assert.deepEqual(irA, irB);
    });
  });

  it("should parse empty code without errors", () => {
    const ir = parse("");
    assert.deepEqual(ir.rulesets, []);
  });

  it("should parse simple rules", () => {
    const ir = parse("m ~ n");
    assert.deepEqual(ir.rulesets, [
      {
        constraint: {
          left: "_",
          right: "_",
        },
        rules: [
          {
            left: [createTerminalSound("m")],
            right: [createTerminalSound("n")],
            environment: {
              left: createTerminalSound("_"),
              right: createTerminalSound("_"),
              explicit: false,
            },
          },
        ],
      },
    ]);
  });
});

describe("Parser", () => {
  describe("parseSound", () => {
    it("should be able to parse null", () => {
      const examples = ["{}", " { } "];
      for (const example of examples) {
        const parser = new Parser(example);
        const sound = parser.parseSound();
        assert.equal(sound.tag, SoundTag.Null);
      }
    });
  });
});
