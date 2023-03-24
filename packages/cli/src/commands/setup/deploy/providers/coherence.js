export const command = 'coherence'

export const description = 'Setup Coherence deploy'

export const builder = (yargs) => {
  yargs.option('force', {
    description: 'Overwrite existing configuration',
    type: 'boolean',
    default: false,
  })
}

export const handler = async (options) => {
  const { handler } = await import('./coherenceHandler')
  return handler(options)
}
