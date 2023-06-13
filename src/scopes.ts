// Variable scopes.
import { Sound } from "./tree";

export class Scope {
  // Names defined in the present scope.
  names: Map<string, Sound>;

  // Parent scope.
  outer: Scope | null;

  constructor(outer: Scope | null = null) {
    this.names = new Map();
    this.outer = outer;
  }

  // Defines a variable in the present scope.
  // Redefining a variable name is an error.
  // Masking variables in outer scopes is not an error.
  // A `false` return value indicates an error.
  define(name: string, value: Sound): boolean {
    if (this.names.has(name)) {
      return false;
    }
    this.names.set(name, value);
    return true;
  }

  // Resolve variable name.
  // Returns an error sound if the variable is not defined.
  resolve(name: string): Sound {
    if (this.names.has(name)) {
      return this.names.get(name) as Sound;
    }
    if (this.outer != null) {
      return this.outer.resolve(name);
    }
    return { type: "error" };
  }
}
