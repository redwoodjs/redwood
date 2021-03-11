// the lines that need to be added to App.{js,tsx}
export const config = {
  imports: [`import { createClient } from '@supabase/supabase-js'`],
  init: `const supabaseClient = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
  )`,
  authProvider: {
    client: 'supabaseClient',
    type: 'supabase',
  },
}

// required packages to install
export const webPackages = ['@supabase/supabase-js']
export const apiPackages = []

// any notes to print out when the job is done
export const notes = [
  'You will need to add your Supabase URL (SUPABASE_URL), public API KEY, and JWT SECRET (SUPABASE_KEY, and SUPABASE_JWT_SECRET) to your .env file.',
  'See: https://supabase.io/docs/library/getting-started#reference',
]
