#!/usr/bin/env node
"use strict";

var _module = require("module");
const requireFromTypeScript = (0, _module.createRequire)(require.resolve('typescript/package.json'));
const bins = requireFromTypeScript('./package.json')['bin'];
requireFromTypeScript(bins['tsc']);