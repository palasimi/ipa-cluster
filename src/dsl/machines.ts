// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (c) 2023 Levi Gruspe
// Finite state machines.

/**
 * Attributes of an `AcyclicMachine` state.
 */
type StateAttributes = {
  // Transition symbols from the current state `q` to state `q+1`
  transitions: Set<string>;

  // Set of languages for which the state is an accept state
  languages: Set<string>;
};

/**
 * Creates an empty `StateAttributes`.
 */
function createStateAttributes(): StateAttributes {
  return {
    transitions: new Set(),
    languages: new Set(),
  };
}

/**
 * A deterministic acyclic finite state automaton.
 * See:
 * https://en.wikipedia.org/wiki/Deterministic_acyclic_finite_state_automaton
 */
export class AcyclicMachine {
  // Maps states to their attributes.
  private states: Map<number, StateAttributes> = new Map();

  /**
   * Checks if the state is an accept state for the given language.
   */
  private accepts(state: StateAttributes, language = "_"): boolean {
    const { languages } = state;
    return languages.has("_") || languages.has(language);
  }

  /**
   * Adds a path from start to goal state to the acyclic machine.
   *
   * @param segments - IPA segments used as transitions
   * @param language - Language of query needed to match ("_" for "don't care")
   */
  add(segments: string[], language = "_") {
    for (const [i, segment] of segments.entries()) {
      if (!this.states.has(i)) {
        this.states.set(i, createStateAttributes());
      }
      const attributes = this.states.get(i) as StateAttributes;
      attributes.transitions.add(segment);
    }

    const goal = segments.length;
    if (!this.states.has(goal)) {
      this.states.set(goal, createStateAttributes());
    }
    (this.states.get(goal) as StateAttributes).languages.add(language);
  }

  /**
   * Checks if the input string causes the acyclic FSM to enter an accept state
   * at some point for the given language.
   */
  test(segments: string[], language = "_"): boolean {
    for (const [i, segment] of segments.entries()) {
      const state = this.states.get(i);
      if (state == null) {
        return false;
      }
      if (this.accepts(state, language)) {
        return true;
      }
      if (!state.transitions.has(segment)) {
        return false;
      }
    }
    const state = this.states.get(segments.length);
    if (state == null) {
      return false;
    }
    return this.accepts(state, language);
  }
}
