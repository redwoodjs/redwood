import fs from 'fs'

import { standardAuthHandler } from '@redwoodjs/cli-helpers'

import { Args } from './setup'

const { version } = JSON.parse(fs.readFileSync('../package.json', 'utf-8'))

export async function handler({ force: forceArg }: Args) {
  standardAuthHandler({
    basedir: __dirname,
    forceArg,
    provider: 'nhost',
    authDecoderImport:
      "import { nhostAuthDecoder as authDecoder } from '@redwoodjs/auth-providers-api'",
    apiPackages: [`@redwoodjs/auth-providers-api@${version}`],
    webPackages: [
      `@redwoodjs/auth-providers-web@${version}`,
      '@nhost/nhost-js',
    ],
    notes: [
      "You will need to add your project's backend URL (NHOST_BACKEND_URL) and",
      'JWT Key Secret (NHOST_JWT_SECRET) to your .env file.',
    ],
  })
}
