import fs from 'fs'
import path from 'path'

import chalk from 'chalk'
import execa from 'execa'
import Listr from 'listr'

import { getPaths, writeFile } from '../../../lib'
import c from '../../../lib/colors'

export const command = 'tailwind'
export const description = 'Setup tailwindcss and PostCSS'
export const builder = (yargs) => {
  yargs.option('force', {
    alias: 'f',
    default: false,
    description: 'Overwrite existing configuration',
    type: 'boolean',
  })

  yargs.option('install', {
    alias: 'i',
    default: true,
    description: 'Install packages',
    type: 'boolean',
  })
}

const tailwindImport = "import 'tailwindcss/tailwind.css'\n"

const tailwindImportExist = (app) => new RegExp(tailwindImport).test(app)

const addTailwindImport = (app) => {
  const i = app.indexOf("import './index.css'")
  return app.substring(0, i) + tailwindImport + app.substring(i)
}

export const handler = async ({ force, install }) => {
  const tasks = new Listr([
    {
      title: 'Installing packages...',
      skip: () => !install,
      task: () => {
        return new Listr([
          {
            title:
              'Install postcss, postcss-loader, tailwindcss, and autoprefixer',
            task: async () => {
              await execa('yarn', [
                'workspace',
                'web',
                'add',
                '-D',
                'postcss',
                'postcss-loader',
                'tailwindcss',
                'autoprefixer',
              ])
            },
          },
        ])
      },
    },
    {
      title: 'Configuring PostCSS...',
      task: () => {
        /**
         * Make web/config if it doesn't exist
         * and write postcss.config.js there
         */

        /**
         * Check if PostCSS config already exists.
         * If it exists, throw an error.
         */
        const postCSSConfigPath = getPaths().web.postcss

        if (!force && fs.existsSync(postCSSConfigPath)) {
          throw new Error(
            'PostCSS config already exists.\nUse --force to override existing config.'
          )
        } else {
          return writeFile(
            postCSSConfigPath,
            fs
              .readFileSync(
                path.resolve(
                  __dirname,
                  'templates',
                  'postcss.config.js.template'
                )
              )
              .toString(),
            { overwriteExisting: force }
          )
        }
      },
    },
    {
      title: 'Initializing Tailwind CSS...',
      task: async () => {
        const webConfigPath = getPaths().web.config
        const tailwindConfigPath = path.join(
          webConfigPath,
          'tailwind.config.js'
        )

        if (fs.existsSync(tailwindConfigPath)) {
          if (force) {
            // `yarn tailwindcss init` will fail these files already exists
            fs.unlinkSync(tailwindConfigPath)
          } else {
            throw new Error(
              'Tailwindcss config already exists.\nUse --force to override existing config.'
            )
          }
        }

        await execa('yarn', [
          'tailwindcss',
          'init',
          tailwindConfigPath,
          '--jit',
        ])

        // add purge and lint
        const tailwindConfig = fs.readFileSync(tailwindConfigPath, 'utf-8')
        const newTailwindConfig = tailwindConfig.replace(
          'purge: []',
          "purge: ['src/**/*.{js,jsx,ts,tsx}']"
        )

        fs.writeFileSync(tailwindConfigPath, newTailwindConfig)

        await execa('yarn', ['eslint', '--fix', tailwindConfigPath])
      },
    },
    {
      title: 'Adding import to App.{js|tsx}...',
      task: (_ctx, task) => {
        const APP_PATH = getPaths().web.app
        const app = fs.readFileSync(APP_PATH, 'utf-8')

        if (tailwindImportExist(app)) {
          task.skip('Imports already exist in App.{js|tsx}')
        } else {
          const newApp = addTailwindImport(app)
          fs.writeFileSync(APP_PATH, newApp)
        }
      },
    },
    {
      title: 'One more thing...',
      task: (_ctx, task) => {
        task.title = `One more thing...\n
          ${c.green('Tailwind configured with "Just-in-Time" mode')}\n
          ${chalk.hex('#e8e8e8')(
            'See this doc for info: https://tailwindcss.com/docs/just-in-time-mode'
          )}
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
