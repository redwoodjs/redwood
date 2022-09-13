import yargs from 'yargs'

import {
  standardAuthBuilder,
  standardAuthHandler,
} from '@redwoodjs/cli-helpers'

export const command = 'ethereum'
export const description = 'Generate an auth configuration for Ethereum'
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
    provider: 'ethereum',
    webPackages: ['@oneclickdapp/ethereum-auth', '@apollo/client'],
    apiPackages: ['ethereumjs-util', 'eth-sig-util', 'jsonwebtoken'],
    notes: [
      'There are a couple more things you need to do!',
      'Please see the readme for instructions:',
      'https://github.com/oneclickdapp/ethereum-auth',
      'This is a FOSS community-maintained package.',
      'Help us make it better!',
    ],
  })
}
