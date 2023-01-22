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
    provider: 'supabase',
    authDecoderImport: `import { authDecoder } from '@redwoodjs/auth-supabase-api'`,
    apiPackages: [`@redwoodjs/auth-supabase-api@${version}`],
    webPackages: [
      `@redwoodjs/auth-supabase-web@${version}`,
      '@supabase/supabase-js@1.35.7',
    ],
    notes: [
      'You will need to add your Supabase URL (SUPABASE_URL), public API KEY,',
      'and JWT SECRET (SUPABASE_KEY, and SUPABASE_JWT_SECRET) to your .env file.',
      'See: https://supabase.io/docs/library/getting-started#reference',
    ],
  })
}
