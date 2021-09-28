#!/usr/bin/env node
import path from 'path'

import requireDirectory from 'require-directory'
import task from 'tasuku'
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

const getCodemods = ({
  from = getRWVersion(),
  to,
}: {
  from?: string
  to: string
}) => {
  console.log(`🗯 \n ~ file: codemods.ts ~ line 32 ~ to`, to)
  console.log(`🗯 \n ~ file: codemods.ts ~ line 32 ~ from`, from)
  const codemodDirs = requireDirectory(
    module,
    path.join(__dirname, 'codemods/v0.37.x')
  )

  const tasks = []

  for (const [codemodName, codemodExports] of Object.entries(
    /**
     * `codemods` is an object whose keys are also objects.
     */
    codemodDirs as Record<string, Record<string, any>>
  )) {
    tasks.push(codemodExports[`${codemodName}.yargs`]?.task)
  }

  /**
   * Remove the `undefined`s in the array from the codemods that didn't have a yargs file.
   */
  return tasks.filter(Boolean)
}

const getRWVersion = () => {
  return '36'
}

/**
 * No command was provided.
 *
 * If `--from` and `--to` were provided, run a series of codemods.
 * Otherwise, show help
 */
if (argv._.length === 0) {
  if (argv.to) {
    const { from, to } = argv

    const codemods = getCodemods({ from, to })

    /**
     * Run all the codemods using tasuku's `group` function.
     * The advantages of using `task.group` are enumerated in [Running tasks in parallel](https://github.com/privatenumber/tasuku#running-tasks-in-parallel)
     *
     * @see {@link https://github.com/privatenumber/tasuku#grouped-tasks}
     */
    task.group((task) => codemods.map((codemod) => codemod(task)), {
      stopOnError: false,
    })
  } else {
    yargs.showHelp()
  }
}
