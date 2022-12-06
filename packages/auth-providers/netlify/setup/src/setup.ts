import yargs from 'yargs'

import {
  standardAuthBuilder,
  standardAuthHandler,
} from '@redwoodjs/cli-helpers'

export const command = 'netlify'
export const description = 'Generate an auth configuration for Netlify'
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
    provider: 'netlify',
    authDecoderImport:
      "import { authDecoder } from '@redwoodjs/auth-netlify-api'",
    apiPackages: ['@redwoodjs/auth-netlify-api'],
    webPackages: [
      '@redwoodjs/auth-netlify-web',
      'netlify-identity-widget@1.9.2',
      '@types/netlify-identity-widget',
    ],
    notes: [
      'You will need to enable Identity on your Netlify site and configure the API endpoint.',
      'See: https://github.com/netlify/netlify-identity-widget#localhost',
    ],
  })
}
