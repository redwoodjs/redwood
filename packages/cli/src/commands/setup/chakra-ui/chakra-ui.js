import execa from 'execa'
import Listr from 'listr'

import c from '../../../lib/colors'

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
    '@chakra-ui/react@^1',
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
      title: 'Setting up Chakra UI',
      task: () => {
        if (checkSetupStatus() === 'done') {
          return
        }
        wrapWithChakraProvider()
      },
    },
    {
      title: 'Integrate with storybook',
      task: () => {
        // add custom webpack aliases for emotion here: getPaths().web.storybookConfig
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
