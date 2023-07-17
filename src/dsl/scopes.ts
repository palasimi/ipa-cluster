// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (c) 2023 Levi Gruspe
// Variable scopes.

/**
 * Exception thrown by `Scope` when trying to resolve an undefined variable.
 */
export class NameError extends Error {}

/**
 * Represents a scope of variable definitions.
 */
export class Scope<T> {
  // Names defined in the present scope.
  names: Map<string, T>;

  // Parent scope.
  outer: Scope<T> | null;

  constructor(outer: Scope<T> | null = null) {
    this.names = new Map();
    this.outer = outer;
  }

  /**
   * Defines a variable in the present scope.
   * Redefining a variable name is an error.
   * Masking variables defined in outer scopes is not an error.
   * Returns `true` if there are no errors.
   */
  define(name: string, value: T): boolean {
    if (this.names.has(name)) {
      return false;
    }
    this.names.set(name, value);
    return true;
  }

  /**
   * Tries to resolve a variable name.
   * Throws a `NameError` if the variable is not defined.
   * Returns the value assigned to the variable.
   */
  resolve(name: string): T {
    if (this.names.has(name)) {
      return this.names.get(name) as T;
    }
    if (this.outer != null) {
      return this.outer.resolve(name);
    }
    throw new NameError(`variable '${name}' is not defined`);
  }
}
