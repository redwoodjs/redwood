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
    webPackages: [
      '@clerk/clerk-react@3.5.1',
      `@redwoodjs/auth-clerk-web@${version}`,
    ],
    apiPackages: [`@redwoodjs/auth-clerk-api@${version}`],
    notes: [
      "You'll need to add three env vars to your .env file:",
      '',
      '```title=".env"',
      'CLERK_FRONTEND_API_URL="Frontend API Key"',
      'CLERK_API_KEY="Backend API Key"',
      'CLERK_JWT_KEY="JWT Verification Key"',
      '```',
      '',
      `You can find their values under "API Keys" on your Clerk app's dashboard.`,
      'Be sure to include `CLERK_FRONTEND_API_URL` in the `includeEnvironmentVariables` array in redwood.toml.',
      '',
      '```toml title="redwood.toml"',
      'includeEnvironmentVariables = [',
      '  "CLERK_FRONTEND_API_URL"',
      '  "CLERK_API_KEY"',
      ']',
      '```',
      '',
      'Also see https://redwoodjs.com/docs/auth/clerk for a full walkthrough.',
    ],
  })
}
