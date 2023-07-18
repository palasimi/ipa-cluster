// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (c) 2023 Levi Gruspe
// Aligned intermediate representations.

import { ExpandedIR } from "./expand";
import { SequenceSound } from "./operators";

type Alignment = [SequenceSound, SequenceSound];

/**
 * Pads left and right sequences with "_" or "#" so that the sequences are
 * aligned.
 */
function pad(left: SequenceSound, right: SequenceSound): Alignment {
  const leftCopy = left.slice();
  const rightCopy = right.slice();

  const short = left.length < right.length ? leftCopy : rightCopy;
  const long = left.length < right.length ? rightCopy : leftCopy;

  // Add padding to shorter sequence.
  // TODO consider adding padding to the left to maximize number of aligned
  // segments between the two sequences.
  const padString = short[short.length - 1] === "#" ? "#" : "_";
  while (short.length < long.length) {
    short.push(padString);
  }
  return [leftCopy, rightCopy];
}

/**
 * Like an `ExpandedIR`, but sequences on each side of a rule are guaranteed to
 * be aligned (same size and padded by "_").
 */
export type AlignedIR = ExpandedIR;

/**
 * Compiles an `ExpandedIR` into an `AlignedIR`.
 */
export function align(ir: ExpandedIR): AlignedIR {
  const rules = [];
  for (const { constraint, left, right } of ir.rules) {
    const alignment = pad(left, right);
    rules.push({
      constraint,
      left: alignment[0],
      right: alignment[1],
    });
  }
  return { rules };
}
