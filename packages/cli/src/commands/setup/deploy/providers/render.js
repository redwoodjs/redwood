export const command = 'render'
export const description = 'Setup Render deploy'

export const builder = (yargs) =>
  yargs.option('database', {
    alias: 'd',
    choices: ['none', 'postgresql', 'sqlite'],
    description: 'Database deployment for Render only',
    default: 'postgresql',
    type: 'string',
  })

export async function handler(options) {
  const { handler } = await import('./renderHandler.js')
  return handler(options)
}
