import { Session, User, Provider } from '@supabase/gotrue-js'
import type { SupabaseClient } from '@supabase/supabase-js'

import type { AuthClient } from './index'
export type Supabase = SupabaseClient
export type SupabaseUser = User

export interface AuthClientSupabase extends AuthClient {
  login(options: {
    email: string
    password: string
  }): Promise<{
    data: Session | null
    user: User | null
    provider?: Provider
    url?: string | null
    error: Error | null
  }>
  logout(): Promise<{ error: Error | null }>
  signup(options: {
    email: string
    password: string
  }): Promise<{
    data: Session | null
    user: User | null
    error: Error | null
  }>
  client: Supabase
}

export const supabase = (client: Supabase): AuthClientSupabase => {
  return {
    type: 'supabase',
    client,
    login: ({ email, password }) => client.auth.signIn({ email, password }),
    logout: () => client.auth.signOut(),
    signup: ({ email, password }) => client.auth.signUp({ email, password }),
    getToken: async () => {
      const currentSession = client.auth.session()
      return currentSession?.access_token || null
    },
    getUserMetadata: async () => client.auth.user(),
  }
}
