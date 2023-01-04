import yargs from 'yargs'

import { standardAuthBuilder } from '@redwoodjs/cli-helpers'

export const command = 'azure-active-directory'
export const description =
  'Generate an auth configuration for Azure Active Directory'

export function builder(yargs: yargs.Argv) {
  return standardAuthBuilder(yargs)
}

export interface Args {
  force: boolean
}

export async function handler(options: Args) {
  const { handler } = await import('./setupHandler')
  return handler(options)
}
