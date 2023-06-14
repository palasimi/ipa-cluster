// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (c) 2023 Levi Gruspe

// Test parser.ts.

import { parse } from "../../src/sound-change-parser/parser";

import { strict as assert } from "assert";

describe("parse", () => {
  it("should parse empty code without errors", () => {
    const rulesets = parse("");
    assert.deepEqual(rulesets, []);
  });

  it("should parse a simple sound change rule", () => {
    const rulesets = parse("m -> n");
    assert.deepEqual(rulesets, [
      {
        context: ["*", "*"],
        rules: [
          {
            lhs: {
              type: "segment",
              value: "m",
            },
            rhs: {
              type: "segment",
              value: "n",
            },
            environment: {
              before: {
                type: "empty",
              },
              after: {
                type: "empty",
              },
            },
          },
        ],
      },
    ]);
  });

  it("should parse assign statements", () => {
    // The results are empty, because the variables aren't used.
    assert.deepEqual(parse("A = a"), []);
    assert.deepEqual(parse("A = { a e i o u }"), []);
  });

  it("should resolve variable names during parsing", () => {
    const codeA = `
			A = { b d g }
			B = { p t k }

			A -> B / _ #
		`;
    const codeB = `
			{ b d g } -> { p t k } / _ #
		`;

    // The two examples above should produce the same parse tree.
    assert.deepEqual(parse(codeA), parse(codeB));
  });
});
