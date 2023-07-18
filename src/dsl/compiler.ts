// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (c) 2023 Levi Gruspe
// IR compiler.
// A facade for other IR transformations.

import { align } from "./align";
import { expand } from "./expand";
import { IR } from "./ir";
import { split, SplitIR } from "./split";
import { squash } from "./squash";

/**
 * An alias for `SplitIR`.
 */
export type FinalIR = SplitIR;

/**
 * Compiles the intermediate representation into a final representation.
 */
export function compile(ir: IR): FinalIR {
  return split(align(expand(squash(ir))));
}
