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
  console.error(ALL_KEYWORD, packages, packages.indexOf(ALL_KEYWORD) !== -1)
  const installPackages = (
    packages.indexOf(ALL_KEYWORD) !== -1 ? ALL_MANTINE_PACKAGES : packages
  ).map((pack) => `@mantine/${pack}`)

  const tasks = new Listr([
    {
      title: 'Installing packages...',
      skip: () => !install,
      task: () => {
        return new Listr([
          {
            title: `Install ${installPackages.join(', ')}`,
            task: async () => {
              await execa('yarn', [
                'workspace',
                'web',
                'add',
                '-D',
                ...installPackages,
              ])
            },
          },
        ])
      },
    },
    {
      title: 'Setting up Mantine',
      skip: () => appSourceContentContains('MantineProvider'),
      task: () =>
        wrapRootComponentWithComponent({
          componentName: 'MantineProvider',
          props: {},
          imports: ["import { MantineProvider } from '@mantine/core'"],
        }),
    },
    {
      title: 'Configure Storybook...',
      skip: () => checkStorybookStatus({ force }) === 'done',
      task: async () =>
        configureStorybook('mantine.storybook.preview.js.template'),
    },
  ])

  try {
    await tasks.run()
  } catch (e) {
    console.error(c.error(e.message))
    process.exit(e?.exitCode || 1)
  }
}
