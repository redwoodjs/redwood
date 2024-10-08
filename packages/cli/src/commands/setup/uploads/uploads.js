import { recordTelemetryAttributes } from '@redwoodjs/cli-helpers'

export const command = 'uploads'

export const description = 'Setup RedwoodJS Uploads'

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
  const { handler } = await import('./uploadsHandler.js')
  return handler(options)
}
