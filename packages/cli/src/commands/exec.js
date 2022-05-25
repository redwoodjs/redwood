import path from 'path'

import Listr from 'listr'
import VerboseRenderer from 'listr-verbose-renderer'
import terminalLink from 'terminal-link'

import { findScripts } from '@redwoodjs/internal'

import { getPaths } from '../lib'
import c from '../lib/colors'
import { configureBabel, runScript } from '../lib/exec'
import { generatePrismaClient } from '../lib/generatePrismaClient'

export const command = 'exec [name]'
export const description = 'Run scripts generated with yarn generate script'
export const builder = (yargs) => {
  yargs
    .positional('name', {
      description: 'The file name (extension is optional) of the script to run',
      type: 'string',
    })
    .option('prisma', {
      type: 'boolean',
      default: true,
      description: 'Generate the Prisma client',
    })
    .option('list', {
      alias: 'l',
      type: 'boolean',
      default: false,
      description: 'List available scripts',
    })
    .strict(false)
    .epilogue(
      `Also see the ${terminalLink(
        'Redwood CLI Reference',
        'https://redwoodjs.com/docs/cli-commands#up'
      )}`
    )
}

const printAvailableScriptsToConsole = () => {
  console.log('Available scripts:')
  findScripts().forEach((scriptPath) => {
    const { name } = path.parse(scriptPath)
    console.log(c.info(`- ${name}`))
  })
  console.log()
}

export const handler = async (args) => {
  const { name, prisma, list, ...scriptArgs } = args
  if (list || !name) {
    printAvailableScriptsToConsole()
    return
  }

  const scriptPath = path.join(getPaths().scripts, name)

  configureBabel()

  try {
    require.resolve(scriptPath)
  } catch {
    console.error(
      c.error(`\nNo script called ${c.underline(name)} in ./scripts folder.\n`)
    )

    printAvailableScriptsToConsole()
    process.exit(1)
  }

  const scriptTasks = [
    {
      title: 'Generating Prisma client',
      enabled: () => prisma,
      task: () => generatePrismaClient({ force: false }),
    },
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
  } catch (e) {
    console.error(c.error(`The script exited with errors.`))
    process.exit(e?.exitCode || 1)
  }
}
