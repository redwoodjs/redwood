#!/usr/bin/env node
import yargs from 'yargs'

const argv = yargs
  .scriptName('codemods')
  .example([
    ['$0 --from 0.36 --to 0.37', 'Run a series of codemods'],
    ['$0 add-directives', 'Run a single codemod'],
  ])
  .option('from', {
    type: 'string',
    description: 'The Redwood version to start at',
  })
  .option('to', {
    type: 'string',
    description: 'The Redwood version to end at',
  })
  .commandDir('./codemods', { recurse: true })
  .strict().argv

/**
 * No command was provided.
 * If `--from` and `--to` are provided, run a series of codemods
 * Otherwise, show help
 */
if (argv._.length === 0) {
  // if (argv.from && argv.to) {
  //   const codemods = getCodemods({ from: argv.from, to: argv.to })
  //   use listr or something to run them
  // } else {
  yargs.showHelp()
  // }
}
