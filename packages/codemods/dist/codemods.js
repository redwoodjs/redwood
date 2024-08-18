#!/usr/bin/env node
"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault").default;
var _yargs = _interopRequireDefault(require("yargs"));
// eslint-disable-next-line @typescript-eslint/no-unused-expressions
_yargs.default.scriptName('codemods').example([['$0 add-directives', 'Run the add-directives codemod']]).commandDir('./codemods', {
  recurse: true,
  extensions: ['yargs.js', 'yargs.ts']
}).demandCommand().strict().argv;