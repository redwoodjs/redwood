import { recordTelemetryAttributes } from '@redwoodjs/cli-helpers'

import { getEpilogue } from './util'

export const command = 'setup-sentry'

export const description = 'Setup Sentry error and performance tracking'

export const EXPERIMENTAL_TOPIC_ID = 4880

export const builder = (yargs) => {
  yargs
    .option('force', {
      alias: 'f',
      default: false,
      description: 'Overwrite existing sentry.js config files',
      type: 'boolean',
    })
    .epilogue(getEpilogue(command, description, EXPERIMENTAL_TOPIC_ID, true))
}

export const handler = async (options) => {
  recordTelemetryAttributes({
    command: 'experimental setup-sentry',
    force: options.force,
  })
  const { handler } = await import('./setupSentryHandler.js')
  return handler(options)
}
