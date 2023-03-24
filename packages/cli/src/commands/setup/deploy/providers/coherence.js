export const command = 'coherence'

export const description = 'Setup Coherence deploy'

export const handler = async (options) => {
  const { handler } = await import('./coherenceHandler')
  return handler(options)
}
