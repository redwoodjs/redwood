import fs from 'fs'
import path from 'path'

import chalk from 'chalk'
import execa from 'execa'
import Listr from 'listr'

import { getPaths, writeFile } from 'src/lib'
import c from 'src/lib/colors'

export const command = 'i18n'
export const description = 'Setup i18n'
export const builder = (yargs) => {
  yargs.option('force', {
    alias: 'f',
    default: false,
    description: 'Overwrite existing configuration',
    type: 'boolean',
  })
}

export const handler = async ({ force }) => {
  const INDEX_JS_PATH = path.join(getPaths().web.src, 'App.js')
  const tasks = new Listr([
    {
      title: 'Installing packages...',
      task: async () => {
        return new Listr([
          {
            title: 'Install i18n, i18next, and react-i18next',
            task: async () => {
              /**
               * Install i18n, i18next, and react-i18next
               */
              await execa('yarn', [
                'workspace',
                'web',
                'add',
                'i18n',
                'i18next',
                'react-i18next',
              ])
            },
          },
          {
            title: 'Sync yarn.lock and node_modules',
            task: async () => {
              /**
               * Sync yarn.lock file and node_modules folder.
               */
              await execa('yarn', ['install', '--check-files'])
            },
          },
        ])
      },
    },
    {
      title: 'Configuring i18n...',
      task: () => {
        /**
         *  Write i18n.js in web/src
         */
        /**
         * TODO:
         * Check if i18n config already exists.
         * If it exists, throw an error.
         */
        return writeFile(
          path.join(getPaths().web.src, 'i18n.js'),
          fs
            .readFileSync(
              path.resolve(__dirname, 'templates', 'i18n.js.template')
            )
            .toString(),
          { overwriteExisting: force }
        )
      },
    },
    {
      title: 'Adding locale file for French...',
      task: async () => {
        /**
         * Make web/src/locales if it doesn't exist
         * and write fr.json there
         */
        /**
         * TODO :
         * Check if fr.json already exists.
         * If it exists, throw an error.
         */
        return writeFile(
          path.join(getPaths().web.src, '/locales/fr.json'),
          fs
            .readFileSync(
              path.resolve(__dirname, 'templates', 'fr.json.template')
            )
            .toString(),
          { overwriteExisting: force }
        )
      },
    },
    {
      title: 'Adding locale file for English...',
      task: async () => {
        /**
         * Make web/src/locales if it doesn't exist
         * and write en.json there
         */
        /**
         * TODO :
         * Check if en.json already exists.
         * If it exists, throw an error.
         */
        return writeFile(
          path.join(getPaths().web.src, '/locales/en.json'),
          fs
            .readFileSync(
              path.resolve(__dirname, 'templates', 'en.json.template')
            )
            .toString(),
          { overwriteExisting: force }
        )
      },
    },
    {
      title: 'Adding import to App.js...',
      task: () => {
        /**
         * Add i18n import to the top of App.js
         */
        /**
         * TODO :
         * Check if i18n import already exists.
         * If it exists, throw an error.
         */
        let indexJS = fs.readFileSync(INDEX_JS_PATH)
        indexJS = [`import './i18n'`, indexJS].join(`\n`)
        fs.writeFileSync(INDEX_JS_PATH, indexJS)
      },
    },
    {
      title: 'One more thing...',
      task: (_ctx, task) => {
        task.title = `One more thing...\n
          ${c.green('Quick link to the docs:')}\n
          ${chalk.hex('#e8e8e8')(
            'https://react.i18next.com/guides/quick-start/'
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
