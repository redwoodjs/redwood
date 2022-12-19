// import terminalLink from 'terminal-link'
import { Listr } from 'listr2'

import { errorTelemetry } from '@redwoodjs/telemetry'

import c from '../../../../lib/colors'
import { printSetupNotes, updateApiURLTask } from '../helpers'

export const command = 'vercel'
export const description = 'Setup Vercel deploy'

const notes = [
  'You are ready to deploy to Vercel!',
  'See: https://redwoodjs.com/docs/deploy#vercel-deploy',
]

export const handler = async () => {
  const tasks = new Listr([updateApiURLTask('/api'), printSetupNotes(notes)], {
    rendererOptions: { collapse: false },
  })
  try {
    await tasks.run()
  } catch (e) {
    errorTelemetry(process.argv, e.message)
    console.error(c.error(e.message))
    process.exit(e?.exitCode || 1)
  }
}
