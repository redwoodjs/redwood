import yargs from 'yargs'

import {
  standardAuthBuilder,
  standardAuthHandler,
} from '@redwoodjs/cli-helpers'

export const command = 'auth okta'
export const description = 'Generate an auth configuration for Okta'
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
    provider: 'okta',
    webPackages: ['@okta/okta-auth-js'],
    apiPackages: ['@okta/jwt-verifier'],
  })
}
