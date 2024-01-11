import type { Argv } from 'yargs'

export const command = 'fragments'
export const description = 'Set up Fragments for GraphQL'

export function builder(yargs: Argv) {
  return yargs.option('force', {
    alias: 'f',
    default: false,
    description: 'Overwrite existing configuration',
    type: 'boolean',
  })
}

export interface Args {
  force: boolean
}

export async function handler({ force }: Args) {
  const { handler } = await import('./fragmentsHandler.js')
  return handler({ force })
}
