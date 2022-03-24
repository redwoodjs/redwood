import execa from 'execa'
import Listr from 'listr'

import c from '../../../../lib/colors'
import {
  checkStorybookStatus,
  configureStorybook,
} from '../tasks/configure-storybook'
import {
  appSourceContentContains,
  wrapRootComponentWithComponent,
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

export async function handler({ force, install }) {
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
      skip: () => appSourceContentContains('ChakraProvider'),
      task: () =>
        wrapRootComponentWithComponent({
          componentName: 'ChakraProvider',
          props: {},
          imports: [
            "import { ChakraProvider, ColorModeScript } from '@chakra-ui/react'",
          ],
          before: '<ColorModeScript />',
        }),
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
