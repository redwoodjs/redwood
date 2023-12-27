import { recordTelemetryAttributes } from '@redwoodjs/cli-helpers'

import { getEpilogue } from './util'

export const EXPERIMENTAL_TOPIC_ID = 4851

export const command = 'setup-server-file'

export const description = 'Setup the experimental server file'

export function builder(yargs) {
  yargs
    .option('force', {
      alias: 'f',
      default: false,
      description: 'Overwrite existing configuration',
      type: 'boolean',
    })
    .option('verbose', {
      alias: 'v',
      default: false,
      description: 'Print more logs',
      type: 'boolean',
    })
    .epilogue(getEpilogue(command, description, EXPERIMENTAL_TOPIC_ID, true))
}

export async function handler(options) {
  recordTelemetryAttributes({
    command: 'experimental setup-server-file',
    force: options.force,
    verbose: options.verbose,
  })
  const { handler } = await import('./setupServerFileHandler.js')
  return handler(options)
}
