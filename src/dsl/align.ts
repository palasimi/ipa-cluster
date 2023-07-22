// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (c) 2023 Levi Gruspe
// Aligned intermediate representations.

import { ExpandedIR } from "./expand";
import { SequenceSound } from "./operators";

type Alignment = [SequenceSound, SequenceSound];

/**
 * Exception thrown by functions in this module when an assertion fails
 * This exception should never reach library users.
 */
class AssertionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

/**
 * Find the number of times that the shorter string should be "shifted" to the
 * right to maximize the number of alignments (matching symbols) with the
 * longer string.
 */
function findOptimalShift(short: SequenceSound, long: SequenceSound): number {
  if (long.length < short.length) {
    throw new AssertionError("expected short.length <= long.length");
  }

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
 * Pads the shorter sequence with null sounds ("_") so that the sequences have
 * the same length.
 * Both sequences should not contain "#".
 */
function padNull(short: SequenceSound, long: SequenceSound): Alignment {
  const shift = findOptimalShift(short, long);
  const newShort = [];
  for (let i = 0; i < shift; i++) {
    newShort.push("_");
  }
  newShort.push(...short);
  while (newShort.length < long.length) {
    newShort.push("_");
  }
  return [newShort, long.slice()];
}

/**
 * Polyfill for `Array.findLastIndex`.
 */
function findLastIndex<T>(array: T[], callback: (value: T) => boolean): number {
  let i = array.length - 1;
  while (i >= 0 && !callback(array[i])) {
    i--;
  }
  return i;
}

/**
 * Removes word boundaries from the sequence.
 * Returns a triple.
 * First element: the trimmed sequence.
 * Second element: number of removed "#"s from the left.
 * Third element: number of removed "#"s from the right.
 */
function trimBoundaries(
  sequence: SequenceSound
): [SequenceSound, number, number] {
  const start = sequence.findIndex((sound) => sound !== "#");

  let end = findLastIndex(sequence, (sound) => sound !== "#") + 1;
  if (end === 0) {
    end = sequence.length;
  }

  const trimmed = sequence.slice(start, end);
  return [trimmed, start, sequence.length - end];
}

/**
 * Reattaches trimmed word boundaries to two sequences, while keeping them
 * aligned.
 */
function bound(
  left: SequenceSound,
  prefixLeft: number,
  suffixLeft: number,
  right: SequenceSound,
  prefixRight: number,
  suffixRight: number
): Alignment {
  const newLeft = [];
  const newRight = [];

  // Add trimmed prefixes.
  if (prefixLeft > 0) {
    newLeft.push("#");
    for (let i = 1; i < prefixLeft; i++) {
      newLeft.push("_");
    }
  }
  if (prefixRight > 0) {
    newRight.push("#");
    for (let i = 1; i < prefixRight; i++) {
      newRight.push("_");
    }
  }

  // Add more padding if the prefixes are not the same length.
  while (newLeft.length < newRight.length) {
    newLeft.push("_");
  }
  while (newRight.length < newLeft.length) {
    newRight.push("_");
  }

  // Add sequences.
  newLeft.push(...left);
  newRight.push(...right);

  if (newLeft.length !== newRight.length) {
    throw new AssertionError("expected the sequences to be the same length");
  }

  // Add trimmed suffixes.
  for (let i = 1; i < suffixLeft; i++) {
    newLeft.push("_");
  }
  for (let i = 1; i < suffixRight; i++) {
    newRight.push("_");
  }
  while (newLeft.length < newRight.length) {
    newLeft.push("_");
  }
  while (newRight.length < newLeft.length) {
    newRight.push("_");
  }
  if (suffixLeft > 0) {
    newLeft.push("#");
    newRight.push(suffixRight > 0 ? "#" : "_");
  } else if (suffixRight > 0) {
    newLeft.push("_");
    newRight.push("#");
  }

  return [newLeft, newRight];
}

/**
 * Pads left and right sequences with "_" or "#" so that the sequences are
 * aligned.
 * "_" means "delete the opposite character".
 * "#" represents a word boundary.
 */
function pad(left: SequenceSound, right: SequenceSound): Alignment {
  // Switch args so that `left.length <= right.length`.
  const [trimmedLeft, prefixLeft, suffixLeft] = trimBoundaries(left);
  const [trimmedRight, prefixRight, suffixRight] = trimBoundaries(right);

  let reversed = false;
  let [short, long] = [trimmedLeft, trimmedRight];
  if (long.length < short.length) {
    [short, long] = [long, short];
    reversed = true;
  }

  let [paddedShort, paddedLong] = padNull(short, long);
  if (reversed) {
    [paddedShort, paddedLong] = [paddedLong, paddedShort];
  }

  const [paddedLeft, paddedRight] = [paddedShort, paddedLong];
  return bound(
    paddedLeft,
    prefixLeft,
    suffixLeft,
    paddedRight,
    prefixRight,
    suffixRight
  );
}

/**
 * Like an `ExpandedIR`, but sequences on each side of a rule are guaranteed to
 * be aligned (same size and padded by "_" or "#").
 * "_" means "delete the corresponding character".
 * "#" represents a word boundary.
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
