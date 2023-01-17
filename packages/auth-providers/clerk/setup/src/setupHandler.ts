import fs from 'fs'
import path from 'path'

import { standardAuthHandler } from '@redwoodjs/cli-helpers'

import { Args } from './setup'

const { version } = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '../package.json'), 'utf-8')
)

export const handler = async ({ force: forceArg }: Args) => {
  standardAuthHandler({
    basedir: __dirname,
    forceArg,
    authDecoderImport: `import { authDecoder } from '@redwoodjs/auth-clerk-api'`,
    provider: 'clerk',
    webPackages: ['@clerk/clerk-react', `@redwoodjs/auth-clerk-web@${version}`],
    apiPackages: [`@redwoodjs/auth-clerk-api@${version}`],
    notes: [
      'You will need to add three environment variables with your Clerk URL, API key and JWT key.',
      'Check out web/src/auth.{js,tsx} for the variables you need to add.',
      'See also: https://redwoodjs.com/docs/authentication#clerk',
    ],
  })
}
