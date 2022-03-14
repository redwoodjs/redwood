// import terminalLink from 'terminal-link'
import path from 'path'

import Listr from 'listr'

import { errorTelemetry } from '@redwoodjs/telemetry'

import { getPaths } from '../../../../lib'
import c from '../../../../lib/colors'
import { addFilesTask, printSetupNotes } from '../helpers'
import { ECOSYSTEM } from '../templates/netlify'

export const command = 'baremetal'
export const description = 'Setup Baremetal deploy'

const files = [
  {
    path: path.join(getPaths().base, 'ecosystem.config.js'),
    content: ECOSYSTEM,
  },
]

const notes = [
  'You are almost ready to deploy!',
  'See: https://redwoodjs.com/docs/deploy#netlify-deploy',
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
