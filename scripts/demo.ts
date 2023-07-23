// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (c) 2023 Levi Gruspe

import { clusterByIPA } from "../src/index";

import { readFileSync } from "node:fs";
import { argv, exit } from "node:process";

const inputFile = argv[2];
const ignoreFile = argv[3];

if (inputFile == null) {
  console.error("missing input file");
  exit(1);
}

const encoding = "utf8";
const dataset = JSON.parse(readFileSync(inputFile, { encoding })).translations;

const options = {
  ignores: ignoreFile == null ? "" : readFileSync(ignoreFile, { encoding }),
  epsilon: 0,
};

const clusters = clusterByIPA(dataset, options);

const json = JSON.stringify({ clusters });
console.log(json);
