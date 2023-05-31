#!/usr/bin/env node

import * as yargs from 'yargs'

// eslint-disable-next-line no-unused-expressions
yargs
  .scriptName('codemods')
  .example([['$0 add-directives', 'Run the add-directives codemod']])
  .commandDir('./codemods', {
    recurse: true,
    extensions: ['yargs.js', 'yargs.ts'],
  })
  .demandCommand()
  .strict().argv
