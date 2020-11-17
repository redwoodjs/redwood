import type {
  GoTrueClient
} from '@supabase/gotrue-js'
// import type { default as GoTrue, User } from 'gotrue-js'

import type { AuthClient } from './index'
export type SupabaseUser = GoTrueClient

export interface SupabaseClient extends GoTrueClient {
  auth: {
    user: () => any
    signIn: (options: {email: string, password: string, remember?: boolean}) => any
    signOut: () => any
    signUp: (options: {email: string, password: string, remember?: boolean}) => any
  }
}
export interface AuthClientSupabase extends AuthClient {
  login(options: {
    email: string
    password: string
  }): Promise<SupabaseUser>
  signup(options: {
    email: string
    password: string
    remember?: boolean
  }): Promise<SupabaseUser>
  client: GoTrueClient
}

export const supabase = (client: SupabaseClient): AuthClientSupabase => {
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
