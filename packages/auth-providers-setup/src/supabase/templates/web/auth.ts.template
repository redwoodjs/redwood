import { createClient } from '@supabase/supabase-js'

import { createSupabaseAuth } from '@redwoodjs/auth-providers-web'

const supabaseClient = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_KEY || ''
)

export const { AuthProvider, useAuth } = createSupabaseAuth(supabaseClient)
