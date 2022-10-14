import yargs from 'yargs'

import {
  standardAuthBuilder,
  standardAuthHandler,
} from '@redwoodjs/cli-helpers'

export const command = 'clerk'
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
    basedir: __dirname,
    rwVersion,
    forceArg,
    authDecoderImport:
      "import { clerkAuthDecoder as authDecoder } from '@redwoodjs/auth-providers-api'",
    provider: 'clerk',
    webPackages: ['@clerk/clerk-react', '@redwoodjs/auth-providers-web'],
    apiPackages: ['@clerk/clerk-sdk-node', '@redwoodjs/auth-providers-api'],
    notes: [
      'You will need to add three environment variables with your Clerk URL, API key and JWT key.',
      'Check out web/src/auth.{js,tsx} for the variables you need to add.',
      'See also: https://redwoodjs.com/docs/authentication#clerk',
    ],
  })
}
