import fs from 'fs'
import Listr from 'listr'
import path from 'path'
import terminalLink from 'terminal-link'

import c from 'src/lib/colors'
import { getPaths, writeFile } from 'src/lib'

export const command = 'webpack'
export const description =
  'Setup webpack in your project so you can add custom config'
export const builder = (yargs) => {
  yargs.option('force', {
    alias: 'f',
    default: false,
    description: 'Overwrite existing configuration',
    type: 'boolean',
  })
}

export const handler = async ({ force }) => {
  const tasks = new Listr([
    {
      title: 'Adding webpack file to your web folder...',
      task: () => {
        const webpackConfigFile = `${getPaths().web.config}/webpack.config.js`

        return writeFile(
          webpackConfigFile,
          fs
            .readFileSync(
              path.resolve(__dirname, 'templates', 'webpack.config.js.template')
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
          )}\n
          ${terminalLink(
            'https://redwoodjs.com/docs/webpack-configuration#configuring-webpack'
          )}
        `
      },
    },
  ])

  try {
    await tasks.run()
  } catch (e) {
    console.log(c.error(e.message))
  }
}
