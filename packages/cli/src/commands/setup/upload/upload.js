import { recordTelemetryAttributes } from '@redwoodjs/cli-helpers'

export const command = 'upload'

export const description = 'Setup RedwoodJS Upload'

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
}

export async function handler(options) {
  recordTelemetryAttributes({
    command: 'setup upload',
    force: options.force,
    verbose: options.verbose,
  })
  const { handler } = await import('./uploadHandler.js')
  return handler(options)
}
