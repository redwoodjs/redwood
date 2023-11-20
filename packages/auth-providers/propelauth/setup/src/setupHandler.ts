import fs from 'fs'
import path from 'path'

import { standardAuthHandler } from '@redwoodjs/cli-helpers'

import type { Args } from './setup'

const { version } = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '../package.json'), 'utf-8')
)

export async function handler({ force: forceArg }: Args) {
  standardAuthHandler({
    basedir: __dirname,
    forceArg,
    provider: 'propelauth',
    authDecoderImport: `import { authDecoder } from '@redwoodjs/auth-propelauth-api'`,
    apiPackages: [`@redwoodjs/auth-propelauth-api@${version}`],
    webPackages: [
      `@redwoodjs/auth-propelauth-web@${version}`,
    ],
  })
}
