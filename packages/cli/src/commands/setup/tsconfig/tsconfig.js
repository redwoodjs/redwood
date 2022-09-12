import path from 'path'

import chalk from 'chalk'
import Listr from 'listr'

import { errorTelemetry } from '@redwoodjs/telemetry'

import {
  getInstalledRedwoodVersion,
  getPaths,
  saveRemoteFileToDisk,
} from '../../../lib'
import c from '../../../lib/colors'

export const command = 'tsconfig'

export const description = 'Set up tsconfig for web and api sides'

export const builder = (yargs) => {
  yargs.option('force', {
    alias: 'f',
    default: false,
    description: 'Overwrite existing tsconfig.json files',
    type: 'boolean',
  })
}

export const handler = async ({ force }) => {
  const installedRwVersion = getInstalledRedwoodVersion()
  const GITHUB_VERSION_TAG = installedRwVersion.match('canary')
    ? 'main'
    : `v${installedRwVersion}`

  const CRWA_TEMPLATE_URL = `https://raw.githubusercontent.com/redwoodjs/redwood/${GITHUB_VERSION_TAG}/packages/create-redwood-app/template`

  const tasks = new Listr([
    {
      title: 'Creating tsconfig in web',
      task: () => {
        const webConfigPath = path.join(getPaths().web.base, 'tsconfig.json')

        const templateUrl = `${CRWA_TEMPLATE_URL}/web/tsconfig.json`

        return saveRemoteFileToDisk(templateUrl, webConfigPath, {
          overwriteExisting: force,
        })
      },
    },
    {
      title: 'Creating tsconfig in api',
      task: () => {
        const webConfigPath = path.join(getPaths().api.base, 'tsconfig.json')

        const templateUrl = `${CRWA_TEMPLATE_URL}/api/tsconfig.json`

        return saveRemoteFileToDisk(templateUrl, webConfigPath, {
          overwriteExisting: force,
        })
      },
    },
    {
      title: 'One more thing...',
      task: (_ctx, task) => {
        task.title = `One more thing...\n
          ${c.green('Quick link to the docs on configuring TypeScript')}
          ${chalk.hex('#e8e8e8')('https://redwoodjs.com/docs/typescript')}
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
