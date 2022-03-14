// import terminalLink from 'terminal-link'
import path from 'path'

import Listr from 'listr'

import { errorTelemetry } from '@redwoodjs/telemetry'

import { getPaths } from '../../../../lib'
import c from '../../../../lib/colors'
import { addFilesTask, printSetupNotes } from '../helpers'
import { DEPLOY, ECOSYSTEM } from '../templates/baremetal'

export const command = 'baremetal'
export const description = 'Setup Baremetal deploy'
export const configFilename = 'deploy.toml'

const files = [
  {
    path: path.join(getPaths().base, configFilename),
    content: DEPLOY,
  },
  {
    path: path.join(getPaths().base, 'ecosystem.config.js'),
    content: ECOSYSTEM,
  },
  {
    path: path.join(getPaths().web, 'serve', '.keep'),
    content: '',
  },
]

const notes = [
  'You are almost ready to go BAREMETAL!',
  '',
  'TODO: Instructions for config setup and first deploy.',
  '',
  'See: https://redwoodjs.com/docs/deploy#baremetal-deploy',
]

export const handler = async ({ force }) => {
  const tasks = new Listr([
    addFilesTask({
      files,
      force,
    }),
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
