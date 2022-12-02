import yargs from 'yargs'

import {
  standardAuthBuilder,
  standardAuthHandler,
} from '@redwoodjs/cli-helpers'

export const command = 'firebase'
export const description = 'Generate an auth configuration for Firebase'
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
    provider: 'firebase',
    authDecoderImport:
      "import { authDecoder } from '@redwoodjs/auth-firebase-api'",
    webPackages: ['firebase', '@redwoodjs/auth-firebase-web'],
    apiPackages: ['firebase-admin', '@redwoodjs/auth-firebase-api'],
    notes: [
      'You will need to create several environment variables with your Firebase config options.',
      'Check out web/src/auth.{js,ts} for the variables you need to add.',
      'See: https://firebase.google.com/docs/web/setup#config-object',
    ],
  })
}
