// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (c) 2023 Levi Gruspe
// Test squash.ts.

import { parse } from "../../src/dsl/parser";
import { squash } from "../../src/dsl/squash";

import { strict as assert } from "assert";

describe("squash", () => {
  it("should flatten a list of rulesets into a list of rules", () => {
    const code = `
      en de.
      | b ~ p / _ #
      | d ~ t / _ #
      | g ~ k / _ #

      en es.
      | ~ a / _ #
      | ~ o / _ #
    `;
    const ir = squash(parse(code));

    const enDE = { left: "en", right: "de" };
    const enES = { left: "en", right: "es" };
    assert.deepEqual(ir, {
      rules: [
        {
          constraint: enDE,
          left: [["b"], ["#"]],
          right: [["p"], ["#"]],
        },
        {
          constraint: enDE,
          left: [["d"], ["#"]],
          right: [["t"], ["#"]],
        },
        {
          constraint: enDE,
          left: [["g"], ["#"]],
          right: [["k"], ["#"]],
        },
        {
          constraint: enES,
          left: [["#"]],
          right: [["a"], ["#"]],
        },
        {
          constraint: enES,
          left: [["#"]],
          right: [["o"], ["#"]],
        },
      ],
    });
  });
});
