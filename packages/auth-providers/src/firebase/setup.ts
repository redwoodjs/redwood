import yargs from 'yargs'

import {
  standardAuthBuilder,
  standardAuthHandler,
} from '@redwoodjs/cli-helpers'

export const command = 'auth firebase'
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
    rwVersion,
    forceArg,
    provider: 'firebase',
    webPackages: ['firebase'],
    apiPackages: ['firebase-admin'],
    notes: [
      'You will need to create several environment variables with your Firebase config options.',
      'Check out web/src/App.{js,tsx} for the variables you need to add.',
      'See: https://firebase.google.com/docs/web/setup#config-object',
    ],
  })
}
