import type {
  SupabaseAuthUser,
  SupabaseClient as Supabase,
  SupabaseAuthResponse,
} from '@supabase/supabase-js'

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
    login: ({ email, password }) => client.auth.signIn({email, password}),
    logout: () => {
      client.auth.signOut()
    },
    signup: ({ email, password }) => client.auth.signUp({email, password}),
    getToken: async () => {
      const supabaseJson = localStorage.getItem('supabase.auth.token')
      const supabaseData = supabaseJson ? JSON.parse(supabaseJson) : null
      return supabaseData?.accessToken || null
    },
    getUserMetadata: async () => client.auth.user(),
  }
}
