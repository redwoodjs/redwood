import { recordTelemetryAttributes } from '@redwoodjs/cli-helpers'

import { getEpilogue } from './util'

export const command = 'studio'
export const description = 'Run the Redwood development studio'

export const EXPERIMENTAL_TOPIC_ID = 4771

export function builder(yargs) {
  yargs
    .option('open', {
      default: true,
      description: 'Open the studio in your browser',
    })
    .epilogue(getEpilogue(command, description, EXPERIMENTAL_TOPIC_ID, true))
}

export async function handler(options) {
  recordTelemetryAttributes({
    command: 'experimental studio',
    open: options.open,
  })
  const { handler } = await import('./studioHandler.js')
  return handler(options)
}
