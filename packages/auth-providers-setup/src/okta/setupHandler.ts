import fs from 'fs'

import { standardAuthHandler } from '@redwoodjs/cli-helpers'

import { Args } from './setup'

const { version } = JSON.parse(fs.readFileSync('../package.json', 'utf-8'))

export const handler = async ({ force: forceArg }: Args) => {
  standardAuthHandler({
    basedir: __dirname,
    forceArg,
    provider: 'okta',
    authDecoderImport:
      "import { oktaAuthDecoder as authDecoder } from '@redwoodjs/auth-providers-api'",
    webPackages: [
      '@okta/okta-auth-js',
      `@redwoodjs/auth-providers-web@${version}`,
    ],
    apiPackages: [
      '@okta/jwt-verifier',
      `@redwoodjs/auth-providers-api@${version}`,
    ],
  })
}
