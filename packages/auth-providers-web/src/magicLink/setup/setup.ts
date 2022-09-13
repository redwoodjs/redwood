import yargs from 'yargs'

import {
  standardAuthBuilder,
  standardAuthHandler,
} from '@redwoodjs/cli-helpers'

export const command = 'magicLink'
export const description = 'Generate an auth configuration for MagicLink'
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
    provider: 'magicLink',
    webPackages: ['magic-sdk'],
    apiPackages: ['@magic-sdk/admin'],
    notes: [
      'To get your application keys, go to https://dashboard.magic.link/login ',
      'Then navigate to the API keys add them to your .env config options.',
      'See: https://redwoodjs.com/docs/authentication#for-magiclink',
    ],
  })
}
