import yargs from 'yargs'

import {
  standardAuthBuilder,
  standardAuthHandler,
} from '@redwoodjs/cli-helpers'

export const command = 'auth nhost'
export const description = 'Generate an auth configuration for nhost'
export const builder = (yargs: yargs.Argv) => {
  return standardAuthBuilder(yargs)
}

interface Args {
  rwVersion: string
  force: boolean
}

export const handler = async ({ rwVersion, force: forceArg }: Args) => {
  standardAuthHandler({
    rwVersion,
    forceArg,
    provider: 'nhost',
    webPackages: ['@nhost/nhost-js'],
    notes: [
      "You will need to add your project's backend URL (NHOST_BACKEND_URL) and",
      'JWT Key Secret (NHOST_JWT_SECRET) to your .env file.',
    ],
  })
}
