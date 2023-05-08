export const command = 'setup-opentelemetry'

export const description = 'Setup OpenTelemetry within the API side'

export const builder = (yargs) => {
  yargs.option('force', {
    alias: 'f',
    default: false,
    description: 'Overwrite existing configuration',
    type: 'boolean',
  })
  yargs.option('verbose', {
    alias: 'v',
    default: false,
    description: 'Print more logs',
    type: 'boolean',
  })
}

export const handler = async (options) => {
  const { handler } = await import('./setupOpentelemetryHandler')
  return handler(options)
}
