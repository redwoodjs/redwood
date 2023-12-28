import { recordTelemetryAttributes } from '@redwoodjs/cli-helpers'

export const command = 'custom-web-index'

export const description =
  'Set up a custom index.js file, so you can customise how Redwood web is mounted in your browser (webpack only)'

export const builder = (yargs) => {
  yargs.option('force', {
    alias: 'f',
    default: false,
    description: 'Overwrite existing index.js file',
    type: 'boolean',
  })
}

export const handler = async (options) => {
  recordTelemetryAttributes({
    command: 'setup custom-web-index',
    force: options.force,
  })
  const { handler } = await import('./custom-web-index-handler.js')
  return handler(options)
}
