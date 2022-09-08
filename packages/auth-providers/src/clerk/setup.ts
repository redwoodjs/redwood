import yargs from 'yargs'

import {
  standardAuthBuilder,
  standardAuthHandler,
} from '@redwoodjs/cli-helpers'

export const command = 'auth clerk'
export const description = 'Generate an auth configuration for Clerk'
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
    provider: 'clerk',
    webPackages: ['@clerk/clerk-react'],
    apiPackages: ['@clerk/clerk-sdk-node'],
    notes: [
      'You will need to add three environment variables with your Clerk URL, API key and JWT key.',
      'Check out web/src/App.{js,tsx} for the variables you need to add.',
      'See also: https://redwoodjs.com/docs/authentication#clerk',
    ],
  })
}
