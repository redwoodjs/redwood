import { recordTelemetryAttributes } from '@redwoodjs/cli-helpers'

export const command = 'webpack'
export const description =
  'Set up webpack in your project so you can add custom config'
export const builder = (yargs) => {
  yargs.option('force', {
    alias: 'f',
    default: false,
    description: 'Overwrite existing configuration',
    type: 'boolean',
  })
}

export const handler = async (options) => {
  recordTelemetryAttributes({
    command: 'setup webpack',
    force: options.force,
  })
  const { handler } = await import('./webpackHandler.js')
  return handler(options)
}
