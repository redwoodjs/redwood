// import terminalLink from 'terminal-link'
import { Listr } from 'listr2'

import { recordTelemetryAttributes } from '@redwoodjs/cli-helpers'
import { errorTelemetry } from '@redwoodjs/telemetry'

import { printSetupNotes } from '../../../../lib'
import c from '../../../../lib/colors'
import { updateApiURLTask } from '../helpers'

export const command = 'vercel'
export const description = 'Setup Vercel deploy'

const notes = [
  'You are ready to deploy to Vercel!',
  'See: https://redwoodjs.com/docs/deploy#vercel-deploy',
]

export const handler = async () => {
  recordTelemetryAttributes({
    command: 'setup deploy vercel',
  })
  const tasks = new Listr([updateApiURLTask('/api'), printSetupNotes(notes)], {
    rendererOptions: { collapseSubtasks: false },
  })
  try {
    await tasks.run()
  } catch (e) {
    errorTelemetry(process.argv, e.message)
    console.error(c.error(e.message))
    process.exit(e?.exitCode || 1)
  }
}
