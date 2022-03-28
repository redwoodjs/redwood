import path from 'path'

import execa from 'execa'
import Listr from 'listr'

import { getPaths } from '../../../../lib'
import c from '../../../../lib/colors'
import {
  checkStorybookStatus,
  configureStorybook,
} from '../tasks/configure-storybook'
import {
  appJSContains,
  extendAppJS,
  createFile,
} from '../tasks/setup-component-library'

export const command = 'chakra-ui'
export const description = 'Set up Chakra UI'

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
}

const CHAKRA_THEME_AND_COMMENTS = [
  '// This object will be used to override Chakra-UI theme defaults.',
  '// See https://chakra-ui.com/docs/styled-system/theming/theme for theming options',
  'module.exports = {}\n',
]

export async function handler({ force, install }) {
  const rwPaths = getPaths()

  const packages = [
    '@chakra-ui/react',
    '@emotion/react@^11',
    '@emotion/styled@^11',
    'framer-motion@^4',
  ]

  const tasks = new Listr([
    {
      title: 'Installing packages...',
      skip: () => !install,
      task: () => {
        return new Listr([
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
        ])
      },
    },
    {
      title: 'Setting up Chakra UI...',
      skip: () => appJSContains('ChakraProvider'),
      task: () =>
        extendAppJS({
          wrapTag: {
            wrapperComponent: 'ChakraProvider',
            wrapperProps: { theme: 'extendedTheme' },
            wrappedComponent: 'RedwoodApolloProvider',
            before: '<ColorModeScript />',
          },
          imports: [
            "import { ChakraProvider, ColorModeScript, extendTheme } from '@chakra-ui/react'",
            "import * as theme from 'config/chakra.config'",
          ],
          moduleScopeLines: ['const extendedTheme = extendTheme(theme)'],
        }),
    },
    {
      title: `Creating Theme File...`,
      task: async () => {
        return createFile({
          filepath: path.join(rwPaths.web.config, 'chakra.config.js'),
          overwrite: force,
          contentLines: CHAKRA_THEME_AND_COMMENTS,
          alreadyExistsError:
            'Chakra config already exists.\nUse --force to override existing config.',
        })
      },
    },
    {
      title: 'Configure Storybook...',
      skip: () => checkStorybookStatus({ force }) === 'done',
      task: async () =>
        configureStorybook('chakra.storybook.preview.js.template'),
    },
  ])

  try {
    await tasks.run()
  } catch (e) {
    console.error(c.error(e.message))
    process.exit(e?.exitCode || 1)
  }
}
