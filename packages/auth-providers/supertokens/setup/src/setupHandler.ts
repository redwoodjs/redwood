import fs from 'fs'
import path from 'path'

import { standardAuthHandler } from '@redwoodjs/cli-helpers'

import { Args } from './setup'

const { version } = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '../package.json'), 'utf-8')
)

export async function handler({ force: forceArg }: Args) {
  standardAuthHandler({
    basedir: __dirname,
    forceArg,
    provider: 'supertokens',
    authDecoderImport:
      "import { authDecoder } from '@redwoodjs/auth-supertokens-api'",
    apiPackages: [
      `@redwoodjs/auth-supertokens-api@${version}`,
      'supertokens-node@^12',
    ],
    webPackages: [
      `@redwoodjs/auth-supertokens-web@${version}`,
      'supertokens-auth-react@^0',
      'supertokens-web-js@^0',
    ],
    notes: [
      "We've implemented some of SuperToken's recipes, but feel free",
      'to switch to something that better fits your needs. See https://supertokens.com/docs/guides.',
    ],
  })
}
