import { recordTelemetryAttributes } from '@redwoodjs/cli-helpers'

import { getEpilogue } from './util'

export const EXPERIMENTAL_TOPIC_ID = 5002

export const command = 'generate-realtime <name>'

export const description =
  'Generate a subscription or live query used with the experimental RedwoodJS Realtime feature'

export function builder(yargs) {
  yargs
    // .scriptName('rw exp generate-realtime')
    .positional('name', {
      type: 'string',
      description:
        'Name of the realtime event to setup. This should be a type or model name like: Widget, Sprocket, etc.',
      demandOption: true,
    })
    .option('type', {
      alias: 't',
      type: 'string',
      choices: ['liveQuery', 'subscription'],
      description: 'Type of realtime event to setup',
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
    command: 'experimental generate-realtime',
    type: options.type,
    force: options.force,
    verbose: options.verbose,
  })
  const { handler } = await import('./generateRealtimeHandler.js')
  return handler(options)
}
