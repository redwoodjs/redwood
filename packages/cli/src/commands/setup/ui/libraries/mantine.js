import path from 'path'

import execa from 'execa'
import { Listr } from 'listr2'

import { getPaths, writeFile } from '../../../../lib'
import c from '../../../../lib/colors'
import extendStorybookConfiguration from '../../../../lib/configureStorybook.js'
import { extendJSXFile, fileIncludes } from '../../../../lib/extendFile'

export const command = 'mantine'
export const description = 'Set up Mantine UI'

const ALL_KEYWORD = 'all'
const ALL_MANTINE_PACKAGES = [
  'core',
  'dates',
  'dropzone',
  'form',
  'hooks',
  'modals',
  'notifications',
  'prism',
  'rte',
  'spotlight',
]

const MANTINE_THEME_AND_COMMENTS = `\
// This object will be used to override Mantine theme defaults.
// See https://mantine.dev/theming/mantine-provider/#theme-object for theming options
module.exports = {}
`

export function builder(yargs) {
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
  yargs.option('packages', {
    alias: 'p',
    default: ['core', 'hooks'],
    description: `Mantine packages to install. Specify '${ALL_KEYWORD}' to install all packages. Default: ['core', 'hooks']`,
    type: 'array',
  })
}

export async function handler({ force, install, packages }) {
  const rwPaths = getPaths()
  const configFilePath = path.join(rwPaths.web.config, 'mantine.config.js')

  const installPackages = (
    packages.includes(ALL_KEYWORD) ? ALL_MANTINE_PACKAGES : packages
  ).map((pack) => `@mantine/${pack}`)

  const tasks = new Listr(
    [
      {
        title: 'Installing packages...',
        skip: () => !install,
        task: () => {
          return new Listr(
            [
              {
                title: `Install ${installPackages.join(', ')}`,
                task: async () => {
                  await execa('yarn', [
                    'workspace',
                    'web',
                    'add',
                    '-D',
                    '@emotion/react',
                    ...installPackages,
                  ])
                },
              },
            ],
            { rendererOptions: { collapse: false } }
          )
        },
      },
      {
        title: 'Setting up Mantine...',
        skip: () => fileIncludes(rwPaths.web.app, 'MantineProvider'),
        task: () =>
          extendJSXFile(rwPaths.web.app, {
            insertComponent: {
              name: 'MantineProvider',
              props: { theme: 'theme' },
              within: 'RedwoodProvider',
            },
            imports: [
              "import { MantineProvider } from '@mantine/core'",
              "import * as theme from 'config/mantine.config'",
            ],
          }),
      },
      {
        title: `Creating Theme File...`,
        task: () => {
          writeFile(configFilePath, MANTINE_THEME_AND_COMMENTS, {
            overwriteExisting: force,
          })
        },
      },
      {
        title: 'Configure Storybook...',
        skip: () => fileIncludes(rwPaths.web.storybookConfig, 'withMantine'),
        task: async () =>
          extendStorybookConfiguration(
            path.join(
              __dirname,
              '..',
              'templates',
              'mantine.storybook.preview.js.template'
            )
          ),
      },
    ],
    { rendererOptions: { collapse: false } }
  )

  try {
    await tasks.run()
  } catch (e) {
    console.error(c.error(e.message))
    process.exit(e?.exitCode || 1)
  }
}
