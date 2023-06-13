// Types in the syntax tree.

export type EmptySound = {
  type: "empty";
};

// "#" marks boundaries in sound change environments.
export type BoundarySound = {
  type: "boundary";
};

export type SegmentSound = {
  type: "segment";

  // An IPA segment.
  value: string;
};

export type UnionSound = {
  type: "union";

  // An array of IPA segments.
  value: string[];
};

// Represents an invalid sound in a sound change rule.
export type ErrorSound = {
  type: "error";
};

// A sound can be an IPA segment, an empty string or "#".
// "#" are only valid in an environment context.
export type Sound =
  | EmptySound
  | BoundarySound
  | SegmentSound
  | UnionSound
  | ErrorSound;

export type Environment = {
  // `before` and `after` are sounds around the sound change.
  // If both are the empty string, then the sound change is always applied.
  before: Sound;
  after: Sound;
};

export type Rule = {
  lhs: Sound;
  rhs: Sound;
  environment: Environment;
};

// Language pair to apply a ruleset to.
// "*" means any language.
export type Context = [string, string];

export type Ruleset = {
  context: Context;
  rules: Rule[];
};
