import yargs from 'yargs'

import {
  standardAuthBuilder,
  standardAuthHandler,
} from '@redwoodjs/cli-helpers'

export const command = 'supertokens'
export const description = 'Generate an auth configuration for SuperTokens'
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
    provider: 'supertokens',
    webPackages: ['supertokens-auth-react'],
    apiPackages: ['supertokens-node'],
    notes: [
      "We've generated some example recipe implementations, but do feel free",
      'to switch to something else that better fit your needs.',
      'See: https://supertokens.com/docs/guides',
    ],
  })
}
