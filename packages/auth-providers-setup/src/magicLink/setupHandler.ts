import fs from 'fs'

import { standardAuthHandler } from '@redwoodjs/cli-helpers'

import { Args } from './setup'

const { version } = JSON.parse(fs.readFileSync('../package.json', 'utf-8'))

export async function handler({ force: forceArg }: Args) {
  standardAuthHandler({
    basedir: __dirname,
    forceArg,
    provider: 'magicLink',
    authDecoderImport:
      "import { magicLinkAuthDecoder as authDecoder } from '@redwoodjs/auth-providers-api'",
    apiPackages: [
      `@redwoodjs/auth-providers-api@${version}`,
      '@magic-sdk/admin',
    ],
    webPackages: [`@redwoodjs/auth-providers-web@${version}`, 'magic-sdk'],
    notes: [
      'To get your application keys, go to https://dashboard.magic.link/login ',
      'Then navigate to the API keys add them to your .env config options.',
      'See: https://redwoodjs.com/docs/authentication#for-magiclink',
    ],
  })
}
