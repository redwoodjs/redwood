#!/usr/bin/env node
"use strict";

var _module = require("module");
const requireFromCli = (0, _module.createRequire)(require.resolve('@redwoodjs/cli/package.json'));
const bins = requireFromCli('./package.json')['bin'];

// If this is defined, we're running through yarn and need to change the cwd.
// See https://yarnpkg.com/advanced/lifecycle-scripts/#environment-variables.
if (process.env.PROJECT_CWD) {
  process.chdir(process.env.PROJECT_CWD);
}
requireFromCli(bins['rwfw']);