import fs from 'fs'
import path from 'path'

import execa from 'execa'
import Listr from 'listr'

import { getPaths } from '../../../lib'
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
      task: () => {
        if (checkSetupStatus() === 'done') {
          return
        }
        wrapWithChakraProvider()
      },
    },
    {
      title: 'Configure Storybook...',
      task: async () => {
        const { storybookPreviewConfig } = getPaths().web

        if (fs.existsSync(storybookPreviewConfig)) {
          if (force) {
            fs.unlinkSync(storybookPreviewConfig)
          } else {
            throw new Error(
              `Storybook preview config already exists at ${storybookPreviewConfig}\nUse --force to override existing config.`
            )
          }
        }

        const storybookPreview = fs.readFileSync(
          path.join(__dirname, 'templates', 'storybook.preview.js.template'),
          'utf-8'
        )
        fs.writeFileSync(storybookPreviewConfig, storybookPreview)

        await execa('yarn', ['eslint', '--fix', storybookPreviewConfig])
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
