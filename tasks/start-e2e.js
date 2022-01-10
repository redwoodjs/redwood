#!/usr/bin/env node
/* eslint-env node, es6*/

const path = require('path')

const execa = require('execa')

const RW_APP_PATH = path.isAbsolute(process.argv[2])
  ? process.argv[2]
  : path.resolve(process.argv[2])

console.log({ RW_APP_PATH })

execa.sync('yarn', ['rw', 'dev', '--no-generate', '--fwd="--no-open"'], {
  cwd: RW_APP_PATH,
  shell: true,
})
