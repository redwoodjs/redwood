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
    authDecoderImport:
      "import { ethereumAuthDecoder as authDecoder } from '@redwoodjs/auth-providers-api'",
    apiPackages: [
      '@redwoodjs/auth-providers-api',
      'ethereumjs-util',
      'eth-sig-util',
      'jsonwebtoken',
    ],
    webPackages: [
      '@redwoodjs/auth-providers-web',
      '@oneclickdapp/ethereum-auth',
      '@apollo/client',
    ],
    notes: [
      'There are a couple more things you need to do!',
      'Please see the readme for instructions:',
      'https://github.com/oneclickdapp/ethereum-auth',
      'This is a FOSS community-maintained package.',
      'Help us make it better!',
    ],
  })
}
