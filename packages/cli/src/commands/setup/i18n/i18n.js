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
  const INDEX_JS_PATH = getPaths().web.app
  const tasks = new Listr([
    {
      title: 'Installing packages...',
      task: async () => {
        await execa('yarn', [
          'workspace',
          'web',
          'add',
          'i18n',
          'i18next',
          'i18next-browser-languagedetector',
          'i18next-http-backend',
          'react-i18next',
        ])
      },
    },
    {
      title: 'Configuring i18n...',
      task: () => {
        /**
         * Write i18n.js in web/src
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
      title: "Adding locale file for 'site' namespace",
      task() {
        return writeFile(getPaths().web.src + '/locales/en/site.json')
      },
    },
    {
      title: 'Adding import to App.{js,tsx}...',
      task: () => {
        /**
         * Add i18n import to the top of App.{js,tsx}
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
          ${chalk.hex('#e8e8e8')(
            'https://github.com/i18next/i18next-browser-languageDetector\n'
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
