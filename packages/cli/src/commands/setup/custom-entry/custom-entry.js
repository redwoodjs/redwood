import fs from 'fs'
import path from 'path'

import chalk from 'chalk'
import Listr from 'listr'

import { getPaths, writeFile } from 'src/lib'
import c from 'src/lib/colors'

export const command = 'custom-entry'

export const description =
  'Setup a custom entry.js file, so you can customise how Redwood web is mounted in your browser'

export const builder = (yargs) => {
  yargs.option('force', {
    alias: 'f',
    default: false,
    description: 'Overwrite existing entry.js file',
    type: 'boolean',
  })
}

export const handler = async ({ force }) => {
  const tasks = new Listr([
    {
      title: 'Creating new entry point in `web/src/entry.js`.',
      task: () => {
        // @TODO figure out how we're handling typescript
        // In this file, we're setting everything to js
        // @Note, getPaths.web.entry is null, when it doesn't exist
        const entryJsFile =
          getPaths().web.entry ?? path.join(getPaths().web.src, 'entry.js')

        // @TODO Copy over the entry file that already exists in package/web
        return writeFile(
          entryJsFile,
          fs
            .readFileSync(
              path.resolve(__dirname, 'templates', 'entry.js.template')
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
            'Quick link to the docs on configuring a custom entry point for your RW app'
          )}
          ${chalk.hex('#e8e8e8')('https://redwoodjs.com/docs/custom-entry')}
        `
      },
    },
  ])

  try {
    await tasks.run()
  } catch (e) {
    console.error(c.error(e.message))
    process.exit(e?.exitCode || 1)
  }
}
