#!/usr/bin/env node
/* eslint-env node, commonjs */

const { build } = require('./apiBuild')

// Hello. Test this like so:
// You're in the root of the RedwoodJS framework directory:
// __REDWOOD__CONFIG_PATH=__fixtures__/example-todo-main node packages/core/esbuild/index.js

console.time('Building API...')
build().then(() => console.timeEnd('Building API...'))
