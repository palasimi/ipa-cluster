// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (c) 2023 Levi Gruspe

// Test evaluate.ts.

import { toQuerier } from "../../src/sound-change-parser/evaluate";
import { parse } from "../../src/sound-change-parser/parser";

import { strict as assert } from "assert";

describe("toQuerier", () => {
  it("basic test", () => {
    const code = "o -> u";
    const tree = parse(code);
    const fn = toQuerier(tree);

    assert.ok(fn("o", "u"));
    assert.ok(fn("u", "o"));

    assert.ok(!fn("o", "e"));
  });

  it("class test", () => {
    const code = "{ a b } -> { d e f }";
    const tree = parse(code);
    const fn = toQuerier(tree);

    for (const left of ["a", "b"]) {
      for (const right of ["d", "e", "f"]) {
        assert.ok(fn(left, right));
        assert.ok(fn(right, left));
      }
    }
  });

  describe("when rule has language annotation", () => {
    it("segments and languages in queries should be aligned to match", () => {
      const code = `
        en de {
          b -> p / _ #
        }
      `;
      const tree = parse(code);
      const fn = toQuerier(tree);

      const environment = { after: "#" };
      const optionsA = {
        context: {
          left: "en",
          right: "de",
        },
        environment,
      };
      const optionsB = {
        context: {
          left: "de",
          right: "en",
        },
        environment,
      };

      assert.ok(fn("b", "p", optionsA));
      assert.ok(!fn("p", "b", optionsA));

      assert.ok(fn("p", "b", optionsB));
      assert.ok(!fn("b", "p", optionsB));
    });
  });

  describe("when rule has no language annotation", () => {
    it("order of segments in queries shouldn't matter", () => {
      const examples = [
        ["a", "b"],
        ["c", "d"],
        ["e", "f"],
        ["g", "h"],
      ];

      let code = "";
      for (const [lhs, rhs] of examples) {
        code += `${lhs} -> ${rhs}${"\n"}`;
      }
      const tree = parse(code);
      const fn = toQuerier(tree);

      assert.ok(code.length > 0);

      for (const [lhs, rhs] of examples) {
        assert.ok(fn(lhs, rhs));
        assert.ok(fn(rhs, lhs));
      }
    });
  });

  describe("when sound change rule specifies an environment", () => {
    const code = "b -> p / _ #";
    const tree = parse(code);
    const fn = toQuerier(tree);

    describe("when query specifies a matching environment", () => {
      it("rule should be found", () => {
        const optionsA = {
          environment: {
            before: "a", // This shouldn't matter.
            after: "#",
          },
        };
        const optionsB = {
          environment: {
            after: "#",
          },
        };
        const optionsC = {
          environment: {
            before: "*",
            after: "#",
          },
        };
        const optionsD = {
          environment: {
            before: "",
            after: "#",
          },
        };

        for (const options of [optionsA, optionsB, optionsC, optionsD]) {
          assert.ok(fn("b", "p", options));
          assert.ok(fn("p", "b", options));
        }
      });
    });

    describe("when query specifies the wrong environment", () => {
      it("rule should not be found", () => {
        assert.ok(!fn("b", "p"));
        assert.ok(!fn("p", "b"));

        const options = {
          environment: {
            before: "q",
            after: "q",
          },
        };
        assert.ok(!fn("b", "p", options));
      });
    });
  });

  describe("when sound change rule does not specify an environment", () => {
    it("rule should be found as long as pair is equivalent", () => {
      const code = "b -> p";
      const tree = parse(code);
      const fn = toQuerier(tree);

      const options = {
        environment: {
          before: "a",
          after: "q",
        },
      };

      assert.ok(fn("b", "p"));
      assert.ok(fn("p", "b"));

      assert.ok(fn("b", "p", options));
      assert.ok(fn("p", "b", options));
    });
  });
});
