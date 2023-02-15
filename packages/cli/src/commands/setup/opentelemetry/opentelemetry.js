export const command = 'opentelemetry'

export const description =
  '[Experimental] Create an OpenTelemetry setup script within the api side'

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
  const { handler } = await import('./opentelemetryHandler')
  return handler(options)
}
