#!/usr/bin/env node

import yargs from 'yargs'

// eslint-disable-next-line no-unused-expressions
yargs
  .scriptName('codemods')
  .example([['$0 add-directives', 'Run the add-directives codemod']])
  .commandDir('./codemods/v0.38.x', { recurse: true })
  .demandCommand()
  .strict().argv
