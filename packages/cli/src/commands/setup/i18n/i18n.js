import fs from 'fs'
import path from 'path'

import chalk from 'chalk'
import execa from 'execa'
import { readFileSync } from 'fs-extra'
import Listr from 'listr'

import { errorTelemetry } from '@redwoodjs/telemetry'

import { getPaths, writeFile } from '../../../lib'
import c from '../../../lib/colors'

export const command = 'i18n'
export const description = 'Set up i18n'
export const builder = (yargs) => {
  yargs.option('force', {
    alias: 'f',
    default: false,
    description: 'Overwrite existing configuration',
    type: 'boolean',
  })
}

const APP_JS_PATH = getPaths().web.app

const i18nImportExist = (appJS) => {
  let content = appJS.toString()

  const hasBaseImport = () => /import '.\/i18n'/.test(content)

  return hasBaseImport()
}
const addI18nImport = (appJS) => {
  var content = appJS.toString().split('\n').reverse()
  const index = content.findIndex((value) => /import/.test(value))
  content.splice(index, 0, "import './i18n'")
  return content.reverse().join(`\n`)
}

const i18nConfigExists = () => {
  return fs.existsSync(path.join(getPaths().web.src, 'i18n.js'))
}
const localesExists = (lng) => {
  return fs.existsSync(path.join(getPaths().web.src, 'locales', lng + '.json'))
}

export const handler = async ({ force }) => {
  const tasks = new Listr([
    {
      title: 'Installing packages...',
      task: async () => {
        return new Listr([
          {
            title:
              'Install i18n, i18next, react-i18next and i18next-browser-languagedetector',
            task: async () => {
              /**
               * Install i18n, i18next, react-i18next and i18next-browser-languagedetector
               */
              await execa('yarn', [
                'workspace',
                'web',
                'add',
                'i18n',
                'i18next',
                'react-i18next',
                'i18next-browser-languagedetector',
              ])
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
         *
         * Check if i18n config already exists.
         * If it exists, throw an error.
         */
        if (!force && i18nConfigExists()) {
          throw new Error(
            'i18n config already exists.\nUse --force to override existing config.'
          )
        } else {
          return writeFile(
            path.join(getPaths().web.src, 'i18n.js'),
            fs
              .readFileSync(
                path.resolve(__dirname, 'templates', 'i18n.js.template')
              )
              .toString(),
            { overwriteExisting: force }
          )
        }
      },
    },
    {
      title: 'Updating Jest configuration to support i18n...',
      task: () => {
        /**
         * Add the appropriate line in the
         * module name mapper of web/jest.config.js.
         */
        const jestConfigPath = path.join(getPaths().web.base, '/jest.config.js')

        const jestConfig = readFileSync(jestConfigPath).toString()

        let newJestConfig

        const operation = {
          add: {
            pattern: "preset: '@redwoodjs/testing/config/jest/web',",
            value: `
  preset: '@redwoodjs/testing/config/jest/web',
  moduleNameMapper: {
    'react-i18next': '<rootDir>/web/__mocks__/react-i18next.js',
  },
`,
          },
          update: {
            pattern: /moduleNameMapper:\s{/,
            value: `
   moduleNameMapper: {
    'react-i18next': '<rootDir>/web/__mocks__/react-i18next.js',
`,
          },
        }

        if (operation.update.pattern.test(jestConfig)) {
          newJestConfig = jestConfig.replace(
            operation.update.pattern,
            operation.update.value
          )
        } else {
          newJestConfig = jestConfig.replace(
            operation.add.pattern,
            operation.add.value
          )
        }

        return writeFile(path.join(jestConfigPath), newJestConfig, {
          overwriteExisting: true,
        })
      },
    },
    {
      title: 'Adding Jest react-i18next mock...',
      task: () => {
        /**
         * Add web/__mocks__/react-i18next.js if it doesn't exist
         */
        return writeFile(
          path.join(getPaths().web.base, '__mocks__/react-i18next.js'),
          fs
            .readFileSync(
              path.resolve(__dirname, 'templates', 'react-i18next.template')
            )
            .toString(),
          { overwriteExisting: force }
        )
      },
    },
    {
      title: 'Adding locale file for French...',
      task: () => {
        /**
         * Make web/src/locales if it doesn't exist
         * and write fr.json there
         *
         * Check if fr.json already exists.
         * If it exists, throw an error.
         */

        if (!force && localesExists('fr')) {
          throw new Error(
            'fr.json config already exists.\nUse --force to override existing config.'
          )
        } else {
          return writeFile(
            path.join(getPaths().web.src, '/locales/fr.json'),
            fs
              .readFileSync(
                path.resolve(__dirname, 'templates', 'fr.json.template')
              )
              .toString(),
            { overwriteExisting: force }
          )
        }
      },
    },
    {
      title: 'Adding locale file for English...',
      task: () => {
        /**
         * Make web/src/locales if it doesn't exist
         * and write en.json there
         *
         * Check if en.json already exists.
         * If it exists, throw an error.
         */
        if (!force && localesExists('en')) {
          throw new Error(
            'en.json already exists.\nUse --force to override existing config.'
          )
        } else {
          return writeFile(
            path.join(getPaths().web.src, '/locales/en.json'),
            fs
              .readFileSync(
                path.resolve(__dirname, 'templates', 'en.json.template')
              )
              .toString(),
            { overwriteExisting: force }
          )
        }
      },
    },
    {
      title: 'Adding import to App.{js,tsx}...',
      task: (_ctx, task) => {
        /**
         * Add i18n import to the last import of App.{js,tsx}
         *
         * Check if i18n import already exists.
         * If it exists, throw an error.
         */
        let appJS = fs.readFileSync(APP_JS_PATH)
        if (i18nImportExist(appJS)) {
          task.skip('Import already exists in App.js')
        } else {
          fs.writeFileSync(APP_JS_PATH, addI18nImport(appJS))
        }
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
    errorTelemetry(process.argv, e.message)
    console.error(c.error(e.message))
    process.exit(e?.exitCode || 1)
  }
}
