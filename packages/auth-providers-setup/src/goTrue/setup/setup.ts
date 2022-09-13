import yargs from 'yargs'

import {
  standardAuthBuilder,
  standardAuthHandler,
} from '@redwoodjs/cli-helpers'

export const command = 'goTrue'
export const description = 'Generate an auth configuration for goTrue'
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
    provider: 'goTrue',
    webPackages: ['gotrue-js'],
    notes: [
      'You will need to enable Identity on your Netlify site and set APIUrl',
      'to your API endpoint in your GoTrue client config.',
      'See: https://github.com/redwoodjs/redwood/blob/main/packages/auth/README.md#for-gotrue-js',
    ],
  })
}
