// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (c) 2023 Levi Gruspe
// Tries.

/**
 * Represents a language code or "_" (don't care).
 */
type Language = string;

/**
 * A node in a trie.
 */
class TrieNode {
  // Maps transition symbols to children nodes.
  children: Map<string, TrieNode> = new Map();

  // Languages for which the node is an accept state.
  acceptedLanguages: Set<Language> = new Set();

  /**
   * Checks if the state is an accept state for the given language.
   * If `language` is "_", returns true if the state is an accept state for any
   * language.
   */
  accepts(language = "_"): boolean {
    const languages = this.acceptedLanguages;
    if (language === "_") {
      return languages.size > 0;
    }
    return languages.has("_") || languages.has(language);
  }
}

/**
 * A trie used for string matching.
 */
export class Trie {
  private root: TrieNode = new TrieNode();

  /**
   * Adds a sequence to the trie.
   * "_"s are ignored.
   *
   * @param input - Input string to use as transition symbols
   * @param language - Language for which the target state of the input is an
   * accept state ("_" stands for don't care)
   */
  add(input: string[], language = "_") {
    let node = this.root;
    for (const symbol of input) {
      // Ignore "_".
      // Normal tries don't do this.
      if (symbol === "_") {
        continue;
      }

      let child = node.children.get(symbol);
      if (child == null) {
        child = new TrieNode();
        node.children.set(symbol, child);
      }
      node = child;
    }

    // Set accept state.
    node.acceptedLanguages.add(language);
  }

  /**
   * Checks if the input string brings the trie to an accept state at some
   * point for the given language.
   * Returns true as soon as an accept state is reached.
   */
  test(input: string[], language = "_"): boolean {
    // TODO handle "#"
    // TODO test every sequence is accepted after trie.add([])
    let node = this.root;
    for (const symbol of input) {
      const child = node.children.get(symbol);
      if (child == null) {
        return false;
      }
      node = child;

      // Early return if already an accept state.
      // Normal tries don't do this.
      if (node.accepts(language)) {
        return true;
      }
    }
    return node.accepts(language);
  }
}
