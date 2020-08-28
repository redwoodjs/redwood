import type { SupabaseAuthUser, SupabaseClient as Supabase, SupabaseAuthResponse} from '@supabase/supabase-js'

import type { AuthClient } from './index'
export type SupabaseUser = SupabaseAuthUser
export type { Supabase }

export interface AuthClientSupabase extends AuthClient {
  login(options: {
    email: string
    password: string
  }): Promise<SupabaseAuthResponse>
  client: Supabase
}

export const supabase = (client: Supabase): AuthClientSupabase => {
  return {
    type: 'supabase',
    client,
    login: async ({ email, password }) =>
      client.auth.login(email, password),
    logout: async () => {
      return client.auth.logout()
    },
    getToken: async () => {
      const supabaseJson = localStorage.getItem('supabase.auth.token')
      const supabaseData = supabaseJson ? JSON.parse(supabaseJson) : null
      console.log(supabaseData?.accessToken)
      return supabaseData?.accessToken || null
    },
    getUserMetadata: async () => client.auth.user(),
  }
}
