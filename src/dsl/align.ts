// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (c) 2023 Levi Gruspe
// Aligned intermediate representations.

import { ExpandedIR } from "./expand";
import { SequenceSound } from "./operators";

type Alignment = [SequenceSound, SequenceSound];

/**
 * Find the number of times that the shorter string should be "shifted" to the
 * right to maximize the number of alignments (matching symbols) with the
 * longer string.
 */
function findOptimalShift(left: SequenceSound, right: SequenceSound): number {
  const short = left.length <= right.length ? left : right;
  const long = left.length <= right.length ? right : left;

  const m = long.length;
  const n = short.length;

  if (m === n) {
    return 0;
  }

  // Find alignment with best score.
  let maxScore = 0;
  let bestStart = 0;
  for (let start = 0; start <= m - n; start++) {
    let score = 0;
    for (let i = 0; i < n; i++) {
      if (short[i] === long[start + i]) {
        score++;
      }
    }

    if (score > maxScore) {
      maxScore = score;
      bestStart = start;
    }
  }
  return bestStart;
}

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
  const shift = findOptimalShift(short, long);
  const leftPadString = short[0] === "#" ? "#" : "_";
  for (let i = 0; i < shift; i++) {
    short.unshift(leftPadString);
  }
  const rightPadString = short[short.length - 1] === "#" ? "#" : "_";
  while (short.length < long.length) {
    short.push(rightPadString);
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
