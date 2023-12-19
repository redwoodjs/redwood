import { recordTelemetryAttributes } from '@redwoodjs/cli-helpers'

import { getEpilogue } from './util'

export const EXPERIMENTAL_TOPIC_ID = null

export const command = 'setup-docker'

export const description = 'Setup the experimental Dockerfile'

export function builder(yargs) {
  yargs
    .option('force', {
      alias: 'f',
      default: false,
      description: 'Overwrite existing configuration',
      type: 'boolean',
    })
    .epilogue(getEpilogue(command, description, EXPERIMENTAL_TOPIC_ID, true))
}

export async function handler(options) {
  recordTelemetryAttributes({
    command: 'experimental setup-docker',
    force: options.force,
    verbose: options.verbose,
  })

  const { handler } = await import('./setupDockerHandler.js')
  return handler(options)
}
