import fs from 'fs'
import path from 'path'

import chalk from 'chalk'
import { Listr } from 'listr2'

import { errorTelemetry } from '@redwoodjs/telemetry'

import { getPaths, writeFile } from '../../../lib'
import c from '../../../lib/colors'

export const command = 'custom-web-index'

export const description =
  'Set up a custom index.js file, so you can customise how Redwood web is mounted in your browser'

export const builder = (yargs) => {
  yargs.option('force', {
    alias: 'f',
    default: false,
    description: 'Overwrite existing index.js file',
    type: 'boolean',
  })
}

export const handler = async ({ force }) => {
  const tasks = new Listr(
    [
      {
        title: 'Creating new entry point in `web/src/index.js`.',
        task: () => {
          // @TODO figure out how we're handling typescript
          // In this file, we're setting everything to js
          // @Note, getPaths.web.index is null, when it doesn't exist
          const entryPointFile =
            getPaths().web.index ?? path.join(getPaths().web.src, 'index.js')

          return writeFile(
            entryPointFile,
            fs
              .readFileSync(
                path.join(
                  getPaths().base,
                  // NOTE we're copying over the index.js before babel transform
                  'node_modules/@redwoodjs/web/src/entry/index.js'
                )
              )
              .toString()
              .replace('~redwood-app-root', './App'),
            { overwriteExisting: force }
          )
        },
      },
      {
        title: 'One more thing...',
        task: (_ctx, task) => {
          task.title = `One more thing...\n
          ${c.green(
            'Quick link to the docs on configuring a custom entry point for your RW app'
          )}
          ${chalk.hex('#e8e8e8')('https://redwoodjs.com/docs/custom-web-index')}
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
