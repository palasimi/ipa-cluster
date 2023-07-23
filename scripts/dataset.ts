// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (c) 2023 Levi Gruspe
// Prepare input data for demo.

import { readFileSync } from "node:fs";
import { argv } from "node:process";

const files = [];
for (let i = 2; i < argv.length; i++) {
  files.push(argv[i]);
}

const dataset = [];
for (const file of files) {
  const json = JSON.parse(readFileSync(file, { encoding: "utf8" }));
  for (const concept of json.concepts) {
    for (const translation of concept.translations) {
      dataset.push(translation);
    }
  }
}

const output = JSON.stringify({ translations: dataset });
console.log(output);
