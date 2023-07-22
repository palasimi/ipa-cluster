// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (c) 2023 Levi Gruspe
// Test compiler.ts.

import { compile } from "../../src/dsl/compiler";

describe("compile", () => {
  it("smoke test", () => {
    const code = "a~b";
    compile(code);
  });
});
