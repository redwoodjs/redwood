#!/usr/bin/env node
import yargs from 'yargs'

// eslint-disable-next-line no-unused-expressions
yargs
  .scriptName('codemods')
  .commandDir('./codemods', { recurse: true })
  .demandCommand()
  .strict().argv
