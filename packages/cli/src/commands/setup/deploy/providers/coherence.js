export const command = 'coherence'

export const description = 'Setup Coherence deploy'

export function builder(yargs) {
  yargs.option('force', {
    description: 'Overwrite existing configuration',
    type: 'boolean',
    default: false,
  })
}

export async function handler(options) {
  const { handler } = await import('./coherenceHandler.js')
  return handler(options)
}
