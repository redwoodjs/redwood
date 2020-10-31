import fs from 'fs'
import path from 'path'

import Listr from 'listr'
import chalk from 'chalk'

import c from 'src/lib/colors'
import { getPaths, writeFile } from 'src/lib'

export const command = 'jest'
export const description = 'Setup Jest Config files'
export const builder = (yargs) => {
  yargs.option('force', {
    alias: 'f',
    default: false,
    description: 'Overwrite existing configuration',
    type: 'boolean',
  })
}

function webJestConfigExists() {
  const { web } = getPaths()
  const webConfigPath = path.join(web.base, 'jest.config.js')
  return fs.existsSync(webConfigPath)
}

function apiJestConfigExists() {
  const { api } = getPaths()
  const apiConfigPath = path.join(api.base, 'jest.config.js')
  return fs.existsSync(apiConfigPath)
}

export const handler = async ({ force }) => {
  const tasks = new Listr([
    {
      title: 'Copying Jest config file for api side...',
      task: () => {
        if (!force && apiJestConfigExists()) {
          throw new Error(
            `api/jest.config.js already exists!\nUse the --force option to overwrite existing config files`
          )
        }
        return writeFile(
          path.join(getPaths().api.base, 'jest.config.js'),
          fs
            .readFileSync(
              path.resolve(
                __dirname,
                'templates',
                'api.jest.config.js.template'
              )
            )
            .toString(),
          { overwriteExisting: force }
        )
      },
    },
    {
      title: 'Copying Jest config file for web side...',
      task: () => {
        if (!force && webJestConfigExists()) {
          throw new Error(
            `web/jest.config.js already exists!\nUse the --force option to overwrite existing config files`
          )
        }
        return writeFile(
          path.join(getPaths().web.base, 'jest.config.js'),
          fs
            .readFileSync(
              path.resolve(
                __dirname,
                'templates',
                'web.jest.config.js.template'
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
          ${c.green('Jest configured successfully!')}\n
          ${chalk.hex('#e8e8e8')('For more info, see the Redwood docs:')}
          ${chalk.hex('#e8e8e8')(
            'https://redwoodjs.com/docs/cli-commands.html#test'
          )}
        `
      },
    },
  ])

  try {
    await tasks.run()
  } catch (e) {
    console.log(c.error(e.message))
    console.log(
      c.info('To overwrite existing files, use the -f flag to --force:')
    )
    console.log(c.green('    yarn rw setup jest -f'))
  }
}
