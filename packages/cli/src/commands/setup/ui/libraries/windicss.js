import fs from 'fs'
import path from 'path'

import execa from 'execa'
import { Listr } from 'listr2'

import { errorTelemetry } from '@redwoodjs/telemetry'

import { getPaths } from '../../../../lib'
import c from '../../../../lib/colors'

export const command = 'windicss'
export const aliases = ['windi']
export const description = 'Set up WindiCSS'
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

const windiImportsExist = (appFile) => appFile.match(/^import 'windi\.css'$/m)

export const handler = async ({ force, install }) => {
  const rwPaths = getPaths()

  const packages = ['windicss-webpack-plugin', 'windicss']

  const tasks = new Listr(
    [
      {
        title: 'Installing packages...',
        skip: () => !install,
        task: () => {
          return new Listr(
            [
              {
                title: `Install ${packages.join(', ')}`,
                task: async () => {
                  await execa('yarn', [
                    'workspace',
                    'web',
                    'add',
                    '-D',
                    ...packages,
                  ])
                },
              },
            ],
            { rendererOptions: { collapse: false } }
          )
        },
      },
      {
        title: 'Setup Webpack...',
        task: () => {
          return new Listr(
            [
              {
                title: 'Setup Webpack',
                task: async () => {
                  await execa('yarn', ['redwood', 'setup', 'webpack'])
                },
              },
              {
                title: 'Configure WindiCSS',
                task: async () => {
                  const webpackConfig = fs.readFileSync(
                    rwPaths.web.webpack,
                    'utf-8'
                  )
                  const newWebpackConfig =
                    `const WindiCSSWebpackPlugin = require('windicss-webpack-plugin')\n\n` +
                    webpackConfig.replace(
                      '// config.plugins.push(YOUR_PLUGIN)',
                      '// config.plugins.push(YOUR_PLUGIN)\n  config.plugins.push(new WindiCSSWebpackPlugin())'
                    )
                  fs.writeFileSync(rwPaths.web.webpack, newWebpackConfig)
                },
              },
            ],
            { rendererOptions: { collapse: false } }
          )
        },
      },
      {
        title: 'Initializing WindiCSS...',
        task: async () => {
          const windiConfigPath = path.join(
            rwPaths.web.config,
            'windi.config.js'
          )

          if (fs.existsSync(windiConfigPath)) {
            if (force) {
              fs.unlinkSync(windiConfigPath)
            } else {
              throw new Error(
                'Windicss config already exists.\nUse --force to override existing config.'
              )
            }
          }

          const windiConfig = [
            "import { defineConfig } from 'windicss/helpers'",
            '',
            'export default defineConfig({',
            '  extract: {',
            "    include: ['**/*.{js,jsx,tsx,css}'],",
            "    exclude: ['node_modules', '.git', 'dist'],",
            '  },',
            '})',
          ].join('\n')
          fs.writeFileSync(windiConfigPath, windiConfig)
        },
      },
      {
        title: `Adding import to ${rwPaths.web.app}...`,
        task: (_ctx, task) => {
          const APP_FILE_PATH = rwPaths.web.app
          const appFile = fs.readFileSync(APP_FILE_PATH, 'utf-8')

          if (windiImportsExist(appFile)) {
            task.skip('Imports already exist in ' + APP_FILE_PATH)
          } else {
            const newAppFile = appFile.replace(
              "import Routes from 'src/Routes'",
              "import Routes from 'src/Routes'\n\nimport 'windi.css'"
            )
            fs.writeFileSync(APP_FILE_PATH, newAppFile)
          }
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
