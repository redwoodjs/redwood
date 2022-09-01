import fs from 'fs'
import path from 'path'

import chalk from 'chalk'
import Listr from 'listr'
import terminalLink from 'terminal-link'

import { errorTelemetry } from '@redwoodjs/telemetry'

import { getPaths, writeFile } from '../../../lib'
import c from '../../../lib/colors'
import { isTypeScriptProject } from '../../../lib/project'

export const command = 'cache <client>'

export const description = 'Sets up an init file for service caching'

export const builder = (yargs) => {
  yargs
    .positional('client', {
      choices: ['memcached', 'redis'],
      description: 'Cache client',
      type: 'string',
      required: true,
    })
    .option('force', {
      alias: 'f',
      default: false,
      description: 'Overwrite existing cache.js file',
      type: 'boolean',
    })
    .epilogue(
      `Also see the ${terminalLink(
        'Redwood CLI Reference',
        'https://redwoodjs.com/docs/cli-commands#setup-cache'
      )}`
    )
}

export const handler = async ({ client, force }) => {
  console.info(client, force)

  const extension = isTypeScriptProject ? 'ts' : 'js'

  const tasks = new Listr([
    {
      title: `Writing api/src/lib/cache.js`,
      task: () => {
        const template = fs
          .readFileSync(
            path.join(__dirname, 'templates', `${client}.ts.template`)
          )
          .toString()

        return writeFile(
          path.join(getPaths().api.lib, `cache.${extension}`),
          template,
          {
            overwriteExisting: force,
          }
        )
      },
    },
    {
      title: 'One more thing...',
      task: (_ctx, task) => {
        task.title = `One more thing...\n
          ${c.green('Check out the Service Cache docs for config and usage:')}
          ${chalk.hex('#e8e8e8')('https://redwoodjs.com/docs/services#caching')}
        `
      },
    },
  ])

  try {
    await tasks.run()
  } catch (e) {
    errorTelemetry(process.argv, e.message)
    console.error(c.error(e.message))
    process.exit(e?.exitCode || 1)
  }
}
