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
      'supertokens-node',
    ],
    webPackages: [
      `@redwoodjs/auth-supertokens-web@${version}`,
      'supertokens-auth-react',
    ],
    notes: [
      "We've generated some example recipe implementations, but do feel free",
      'to switch to something else that better fit your needs.',
      'See: https://supertokens.com/docs/guides',
    ],
  })
}
