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
  only: [getPaths().api.base],
  plugins: [
    [
      'babel-plugin-module-resolver',
      {
        alias: {
          src: getPaths().api.src,
        },
      },
    ],
  ],
  ignore: ['node_modules'],
  cache: false,
})

const { db } = require(path.join(getPaths().api.lib, 'db'))

const runScript = async (scriptPath, scriptArgs) => {
  const script = await import(scriptPath)
  await script.default({ db, args: scriptArgs })
}

export const command = 'run <name>'
export const description = 'Run your script'
export const builder = (yargs) => {
  yargs
    .positional('name', {
      description: 'The name of the script to run',
      type: 'string',
    })
    .strict(false)
    .epilogue(
      `Also see the ${terminalLink(
        'Redwood CLI Reference',
        'https://redwoodjs.com/docs/cli-commands#up'
      )}`
    )
}

export const handler = async (args) => {
  const { name, ...scriptArgs } = args
  const scriptPath = path.join(getPaths().api.scripts, `${name}`)
  try {
    require.resolve(scriptPath)
  } catch {
    console.info(c.error(`\nNo script module exists with that name.\n`))
    process.exit(1)
  }

  const scriptTasks = [
    {
      title: 'Running script',
      task: async () => {
        try {
          await runScript(scriptPath, scriptArgs)
        } catch (e) {
          console.error(c.error(`Error in script: ${e.message}`))
        }
      },
    },
  ]

  const tasks = new Listr(scriptTasks, {
    collapse: false,
    renderer: VerboseRenderer,
  })

  try {
    await tasks.run()
    await db.$disconnect()
  } catch (e) {
    await db.$disconnect()
    console.error(c.error(`The script exited with errors.`))
    process.exit(e?.exitCode || 1)
  }
}
