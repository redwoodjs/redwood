import Listr from 'listr'

import { errorTelemetry } from '@redwoodjs/telemetry'

import c from '../../../../lib/colors'
import {
  ERR_MESSAGE_MISSING_CLI,
  ERR_MESSAGE_NOT_INITIALIZED,
} from '../../../deploy/layer0'
import {
  preRequisiteCheckTask,
  printSetupNotes,
  addPackagesTask,
} from '../helpers'

export const command = 'layer0'
export const description = 'Setup Layer0 deploy'

const notes = [
  'You are almost ready to deploy to Layer0!',
  '',
  'See https://redwoodjs.com/docs/deploy#layer0-deploy for the remaining',
  'config and setup required before you can perform your first deploy.',
]

export const handler = async () => {
  const tasks = new Listr([
    addPackagesTask({
      packages: ['@layer0/cli'],
      devDependency: true,
    }),
    preRequisiteCheckTask([
      {
        title: 'Checking if Layer0 is installed...',
        command: ['yarn', ['layer0', '--version']],
        errorMessage: ERR_MESSAGE_MISSING_CLI,
      },
      {
        title: 'Initializing with Layer0',
        command: ['yarn', ['layer0', 'init']],
        errorMessage: ERR_MESSAGE_NOT_INITIALIZED,
      },
    ]),
    printSetupNotes(notes),
  ])
  try {
    await tasks.run()
  } catch (e) {
    errorTelemetry(process.argv, e.message)
    console.error(c.error(e.message))
    process.exit(e?.exitCode || 1)
  }
}
