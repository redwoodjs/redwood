export const command = 'inngest'

export const description = 'Setup Inngest plugin for job orchestration'

export const builder = (yargs) => {
  yargs.option('force', {
    alias: 'f',
    default: false,
    description: 'Overwrite existing configuration',
    type: 'boolean',
  })
}

export const handler = async (options) => {
  const { handler } = await import('./inngestHandler')
  return handler(options)
}
