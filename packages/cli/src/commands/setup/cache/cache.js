import fs from 'fs'
import path from 'path'

import chalk from 'chalk'
import Listr from 'listr'

import { errorTelemetry } from '@redwoodjs/telemetry'

import { getPaths, writeFile } from '../../../lib'
import c from '../../../lib/colors'

export const command = 'cache'

export const description = 'Sets up an init file for service caching'

export const builder = (yargs) => {
  yargs
    .positional('client', {
      choices: ['memcached', 'redis'],
      description: 'Cache client',
      type: 'string',
    })
    .option('force', {
      alias: 'f',
      default: false,
      description: 'Overwrite existing cache.js file',
      type: 'boolean',
    })
}

export const handler = async ({ client, force }) => {
  const tasks = new Listr([
    {
      title: `Writing api/src/lib/cache.js`,
      task: () => {
        const template = fs
          .readFileSync(path.join('templates', `${client}.ts.template`))
          .toString()

        return writeFile(path.join(getPaths().api.lib, 'cache.js'), template, {
          overwriteExisting: force,
        })
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
