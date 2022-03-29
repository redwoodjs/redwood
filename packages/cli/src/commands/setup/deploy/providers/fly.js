import Listr from 'listr'

import { errorTelemetry } from '@redwoodjs/telemetry'

import c from '../../../../lib/colors'
import {
  ERR_MESSAGE_MISSING_CLI,
  ERR_MESSAGE_NOT_INITIALIZED,
  ERR_MESSAGE_NOT_AUTHED,
} from '../../../deploy/fly'
import { preRequisiteCheckTask, printSetupNotes } from '../helpers'

export const command = 'fly'
export const description = 'Setup Fly.io deploy'

const notes = [
  'You are almost ready to deploy to Fly.io!',
  '',
  'See https://fly.io/docs/getting-started/redwood for the remaining',
  'config and setup required before you can perform your first deploy.',
]

export const handler = async () => {
  const tasks = new Listr([
    preRequisiteCheckTask([
      {
        title: 'Checking if flyctl is installed...',
        command: ['flyctl', ['version']],
        errorMessage: ERR_MESSAGE_MISSING_CLI,
      },
      {
        title: 'Checking for a Fly.io account',
        command: ['flyctl', ['auth', 'whoami']],
        errorMessage: ERR_MESSAGE_NOT_AUTHED,
      },
      {
        title: 'Checking for an existing Fly.io config',
        command: ['bash', ['-c', ' [ -f fly.toml ]']],
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
