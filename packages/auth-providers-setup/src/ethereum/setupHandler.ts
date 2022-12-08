import fs from 'fs'

import { standardAuthHandler } from '@redwoodjs/cli-helpers'

import { Args } from './setup'

const { version } = JSON.parse(fs.readFileSync('../package.json', 'utf-8'))

export async function handler({ force: forceArg }: Args) {
  standardAuthHandler({
    basedir: __dirname,
    forceArg,
    provider: 'ethereum',
    authDecoderImport:
      "import { ethereumAuthDecoder as authDecoder } from '@redwoodjs/auth-providers-api'",
    apiPackages: [
      `@redwoodjs/auth-providers-api@${version}`,
      'ethereumjs-util',
      'eth-sig-util',
      'jsonwebtoken',
    ],
    webPackages: [
      `@redwoodjs/auth-providers-web@${version}`,
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
