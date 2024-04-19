import { recordTelemetryAttributes } from '@redwoodjs/cli-helpers'

import { getEpilogue } from './util'

export const command = 'setup-og-image'

export const description =
  'Setup OG image generation for your RedwoodJS project.'

// TODO: Use one specific to OG image feature
export const EXPERIMENTAL_TOPIC_ID = 5052

export const builder = (yargs) => {
  yargs
    .option('force', {
      alias: 'f',
      default: false,
      description: 'Overwrite existing configuration',
      type: 'boolean',
    })
    .epilogue(getEpilogue(command, description, EXPERIMENTAL_TOPIC_ID, true))
}

export const handler = async (options) => {
  recordTelemetryAttributes({
    command: ['experimental', command].join(' '),
    force: options.force,
  })
  const { handler } = await import('./setupOgImageHandler.js')
  return handler(options)
}
