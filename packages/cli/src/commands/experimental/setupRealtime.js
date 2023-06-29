import { recordTelemetryAttributes } from '@redwoodjs/cli-helpers'

import { getEpilogue } from './util'

export const EXPERIMENTAL_TOPIC_ID = 5002

export const command = 'setup-realtime'

export const description = 'Setup the experimental RedwoodJS Realtime feature'

export function builder(yargs) {
  yargs
    .option('includeExamples', {
      alias: ['e', 'examples'],
      default: true,
      description:
        'Include examples how to implement liveQueries and subscriptions',
      type: 'boolean',
    })
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
    command: 'experimental setup-realtime',
    includeExamples: options.includeExamples,
    force: options.force,
    verbose: options.verbose,
  })
  const { handler } = await import('./setupRealtimeHandler.js')
  return handler(options)
}
