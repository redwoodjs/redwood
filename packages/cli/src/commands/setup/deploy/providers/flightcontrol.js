export const command = 'flightcontrol'
export const alias = 'fc'
export const description = 'Setup Flightcontrol deploy'

export function builder(yargs) {
  yargs.option('database', {
    alias: 'd',
    choices: ['none', 'postgresql', 'mysql'],
    description: 'Database deployment for Flightcontrol only',
    default: 'postgresql',
    type: 'string',
  })
}

export async function handler(options) {
  const { handler } = await import('./flightcontrolHandler.js')
  return handler(options)
}
