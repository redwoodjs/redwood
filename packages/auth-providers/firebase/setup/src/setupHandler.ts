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
    provider: 'firebase',
    authDecoderImport:
      "import { authDecoder } from '@redwoodjs/auth-firebase-api'",
    webPackages: ['firebase@^9', `@redwoodjs/auth-firebase-web@${version}`],
    apiPackages: [
      'firebase-admin@^11',
      `@redwoodjs/auth-firebase-api@${version}`,
    ],
    notes: [
      "You'll need to add three env vars to your .env file:",
      '',
      '```bash title=".env"',
      'FIREBASE_API_KEY="..."',
      'FIREBASE_AUTH_DOMAIN="..."',
      'FIREBASE_PROJECT_ID="..."',
      '```',
      '',
      "You can find their values on your Firebase app's dashboard.",
      'Be sure to include `FIREBASE_API_KEY` and `FIREBASE_AUTH_DOMAIN` in the `includeEnvironmentVariables` array in redwood.toml:',
      '',
      '```toml title="redwood.toml"',
      'includeEnvironmentVariables = [',
      '  "FIREBASE_API_KEY"',
      '  "FIREBASE_AUTH_DOMAIN"',
      ']',
      '```',
      '',
      'Also see https://redwoodjs.com/docs/auth/firebase for a full walkthrough.',
    ],
  })
}
