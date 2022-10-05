import fs from 'fs'
import path from 'path'

import chalk from 'chalk'
import { Listr } from 'listr2'

import { errorTelemetry } from '@redwoodjs/telemetry'

import { getPaths, writeFile } from '../../../lib'
import c from '../../../lib/colors'

export const command = 'webpack'
export const description =
  'Set up webpack in your project so you can add custom config'
export const builder = (yargs) => {
  yargs.option('force', {
    alias: 'f',
    default: false,
    description: 'Overwrite existing configuration',
    type: 'boolean',
  })
}

export const handler = async ({ force }) => {
  const tasks = new Listr(
    [
      {
        title: 'Adding webpack file to your web folder...',
        task: () => {
          const webpackConfigFile = `${getPaths().web.config}/webpack.config.js`

          return writeFile(
            webpackConfigFile,
            fs
              .readFileSync(
                path.resolve(
                  __dirname,
                  'templates',
                  'webpack.config.js.template'
                )
              )
              .toString(),
            { overwriteExisting: force }
          )
        },
      },
      {
        title: 'One more thing...',
        task: (_ctx, task) => {
          task.title = `One more thing...\n
          ${c.green(
            'Quick link to the docs on configuring custom webpack config:'
          )}
          ${chalk.hex('#e8e8e8')(
            'https://redwoodjs.com/docs/webpack-configuration#configuring-webpack'
          )}
        `
        },
      },
    ],
    { rendererOptions: { collapse: false } }
  )

  try {
    await tasks.run()
  } catch (e) {
    errorTelemetry(process.argv, e.message)
    console.error(c.error(e.message))
    process.exit(e?.exitCode || 1)
  }
}
