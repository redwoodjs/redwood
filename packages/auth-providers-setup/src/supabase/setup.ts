import yargs from 'yargs'

import {
  standardAuthBuilder,
  standardAuthHandler,
} from '@redwoodjs/cli-helpers'

export const command = 'supabase'
export const description = 'Generate an auth configuration for Supabase'
export const builder = (yargs: yargs.Argv) => {
  return standardAuthBuilder(yargs)
}

interface Args {
  rwVersion: string
  force: boolean
}

export const handler = async ({ rwVersion, force: forceArg }: Args) => {
  standardAuthHandler({
    basedir: __dirname,
    rwVersion,
    forceArg,
    provider: 'supabase',
    authDecoderImport:
      "import { supabaseAuthDecoder as authDecoder } from '@redwoodjs/auth-providers-api'",
    webPackages: ['@supabase/supabase-js'],
    notes: [
      'You will need to add your Supabase URL (SUPABASE_URL), public API KEY,',
      'and JWT SECRET (SUPABASE_KEY, and SUPABASE_JWT_SECRET) to your .env file.',
      'See: https://supabase.io/docs/library/getting-started#reference',
    ],
  })
}
