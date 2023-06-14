# ipa-cluster

Cluster words with similar IPA transcriptions together.

Similar, in this context, means that the edit distance of the IPA transcriptions is small enough.
The [Levenshtein distance](https://en.wikipedia.org/wiki/Levenshtein_distance) is used to measure this distance.

## Basic example

```typescript
import { clusterByIPA } from "ipa-cluster";

// The IPA transcriptions should be tokenized.
const dataset = [{ ipa: "f uː" }, { ipa: "b ɑː r" }, { ipa: "b ɑː z" }];

// Produces one cluster for [fuː] and another for [bɑːr] and [bɑːz].
const clusters = clusterByIPA(dataset);
```

## Equivalent sounds

By default, the algorithm matches two IPA segments if and only if their string representations are the same.
It is possible to override this behavior by specifying a set of sound change rules.
Here's an example.

```txt
a -> o
b -> p
```

Normally, the algorithm would consider [a] and [o] to be a mismatch, but by including the first rule, the algorithm will treat [a] and [o] as equivalent.

```typescript
const options = {
  ignores: `
        a -> o
        b -> p
    `,
};
const clusters = clusterByIPA(dataset, options);
```

It is called `ignores`, because it specifies which edits/sound changes the algorithm should "ignore".

## Environments

Sound changes can be set to be ignored only in specific environments.

```txt
-- This is a comment.
-- Treat [b] and [p] as equivalent at the end of a word.
b -> p / _ #

-- Treat [b] and [v] as equivalent when surrounded by [a]s.
b -> v / a _ a
```

## Sound classes

Consider the following set of rules.

```txt
q -> g
q -> h
q -> k
q -> x
g -> h
g -> k
g -> x
h -> k
h -> x
k -> x
```

It says that [q], [g], [h], [k] and [x] should all be considered equivalent to each other.
Sound classes make it possible to define rules like this in a more concise manner.
The following expands to the ruleset above.

```txt
{ q g h k x } -> { q g h k x }

-- Or:
A = { q g h k x }
A -> A

-- Note that variable names should be capitalized.
```

Classes can also be used in environments.

```txt
A = { a e i o u y }
s -> z / # _ A
```

## License

Copyright 2023 Levi Gruspe

This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
