import fs from 'fs'

import { standardAuthHandler } from '@redwoodjs/cli-helpers'

import { Args } from './setup'

const { version } = JSON.parse(fs.readFileSync('../package.json', 'utf-8'))

export async function handler({ force: forceArg }: Args) {
  standardAuthHandler({
    basedir: __dirname,
    forceArg,
    provider: 'goTrue',
    authDecoderImport:
      "import { goTrueAuthDecoder as authDecoder } from '@redwoodjs/auth-providers-api'",
    apiPackages: [`@redwoodjs/auth-providers-api@${version}`],
    webPackages: ['gotrue-js', `@redwoodjs/auth-providers-web@${version}`],
    notes: [
      'You will need to enable Identity on your Netlify site and set APIUrl',
      'to your API endpoint in your GoTrue client config.',
      'See: https://redwoodjs.com/docs/auth/gotrue',
    ],
  })
}
