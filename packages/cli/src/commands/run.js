import fs from 'fs'
import path from 'path'

import babelRequireHook from '@babel/register'
import Listr from 'listr'
import VerboseRenderer from 'listr-verbose-renderer'
import terminalLink from 'terminal-link'

import { getPaths } from 'src/lib'
import c from 'src/lib/colors'

babelRequireHook({
  extends: path.join(getPaths().api.base, '.babelrc.js'),
  extensions: ['.js', '.ts', '.tsx', '.jsx'],
  only: [getPaths().base],
  ignore: ['node_modules'],
  cache: false,
})

const { db } = require(path.join(getPaths().api.lib, 'db'))

const runScript = async (scriptPath) => {
  const script = await import(scriptPath)
  const startedAt = new Date()
  const finishedAt = new Date()

  return { startedAt, finishedAt }
}

export const command = 'run'
export const description = 'Run your script'
export const builder = (yargs) => {
  yargs
  .positional('name', {
    description: 'The name of the script to run',
    type: 'string',
  }).epilogue(
    `Also see the ${terminalLink(
      'Redwood CLI Reference',
      'https://redwoodjs.com/docs/cli-commands#up'
    )}`
  )
}

export const handler = async (args) => {
  const scriptPath = path.join(getPaths().api.scripts, `${args.name}.js`)

  if (!fs.existsSync(scriptPath)) {
    console.info(c.error(`\nNo script file (${scriptPath}) exists.\n`))
    process.exit(0)
  }

  const scriptTasks = [
    {
      title: 'Running script',
      task: async () => {
        try {
          const { startedAt, finishedAt } = await runScript(scriptPath)
        } catch (e) {
          console.error(c.error(`Error in script: ${e.message}`))
        }
      },
    }
  ]

  const tasks = new Listr(scriptTasks, {
    collapse: false,
    renderer: VerboseRenderer,
  })

  try {
    await tasks.run()
    await db.$disconnect()
    console.info(c.info('\nScript has completed successfully.\n'))
  } catch (e) {
    await db.$disconnect()
    console.error(
      c.error(`The script exited with errors.`)
    )
    process.exit(e?.exitCode || 1)
  }
}
