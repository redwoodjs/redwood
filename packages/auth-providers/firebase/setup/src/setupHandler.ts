import fs from 'fs'
import path from 'path'

import { standardAuthHandler } from '@redwoodjs/cli-helpers'

import { Args } from './setup'

const { version } = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '../package.json'), 'utf-8')
)

const apiPackageJson = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '../../api/package.json'), 'utf-8')
)
const firebaseAdminVersion = apiPackageJson.devDependencies['firebase-admin']

export async function handler({ force: forceArg }: Args) {
  standardAuthHandler({
    basedir: __dirname,
    forceArg,
    provider: 'firebase',
    authDecoderImport:
      "import { authDecoder } from '@redwoodjs/auth-firebase-api'",
    webPackages: ['firebase', `@redwoodjs/auth-firebase-web@${version}`],
    apiPackages: [
      `firebase-admin@${firebaseAdminVersion}`,
      `@redwoodjs/auth-firebase-api@${version}`,
    ],
    notes: [
      'You will need to create several environment variables with your Firebase config options.',
      'Check out web/src/auth.{js,ts} for the variables you need to add.',
      'See: https://firebase.google.com/docs/web/setup#config-object',
    ],
  })
}
