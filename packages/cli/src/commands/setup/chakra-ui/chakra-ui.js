import execa from 'execa'
import Listr from 'listr'

import c from '../../../lib/colors'

import {
  checkStorybookStatus,
  configureStorybook,
} from './tasks/configure-storybook'
import { checkSetupStatus, wrapWithChakraProvider } from './tasks/setup-chakra'

export const command = 'chakra-ui'
export const description = 'Setup Chakra UI'

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
              await execa(
                'yarn',
                ['workspace', 'web', 'add', '-D', ...packages],
                { cwd: '/Users/timkolberger/Entwicklung/temp/redwook' }
              )
            },
          },
        ])
      },
    },
    {
      title: 'Setting up Chakra UI...',
      skip: () => checkSetupStatus() === 'done',
      task: () => wrapWithChakraProvider(),
    },
    {
      title: 'Configure Storybook...',
      skip: () => checkStorybookStatus({ force }) === 'done',
      task: async () => configureStorybook(),
    },
  ])

  try {
    await tasks.run()
  } catch (e) {
    console.error(c.error(e.message))
    process.exit(e?.exitCode || 1)
  }
}
