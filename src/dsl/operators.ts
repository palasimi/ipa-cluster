// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (c) 2023 Levi Gruspe
// Sound operators.

import { Sound } from "./ir";

/**
 * A sequence of sounds (IPA segments).
 * Not the same as a union of sounds.
 */
export type SequenceSound = string[];

/**
 * Appends a sound to a sequence of sounds.
 */
function append(sequence: SequenceSound, sound: Sound): SequenceSound[] {
  if (sound.length === 0) {
    return [sequence];
  }
  return sound.map((segment) => [...sequence, segment]);
}

/**
 * Appends a sound to multiple sequences of sounds.
 */
function accumulate(sequences: SequenceSound[], sound: Sound): SequenceSound[] {
  if (sequences.length === 0) {
    return append([], sound);
  }
  return sequences.flatMap((sequence) => append(sequence, sound));
}

/**
 * Concatenates any number of sounds.
 * Returns the array of possible concatenations.
 */
export function concatenate(...sounds: Sound[]): SequenceSound[] {
  return sounds.reduce(accumulate, []);
}
