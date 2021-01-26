import { Session, User, Provider } from '@supabase/gotrue-js'
import type { SupabaseClient } from '@supabase/supabase-js'

import type { AuthClient } from './index'
export type Supabase = SupabaseClient
export type SupabaseUser = User

export interface AuthClientSupabase extends AuthClient {
  /**
   * Log in an existing user, or login via a third-party provider.
   * @param option The user login details.
   * @param option.email The user's email address.
   * @param option.password The user's password.
   * @param option.provider One of the providers supported by GoTrue.
   */
  login(options: {
    email?: string | undefined
    password?: string | undefined
    provider?: Provider
  }): Promise<{
    data: Session | null
    user: User | null
    provider?: Provider
    url?: string | null
    error: Error | null
  }>
  logout(): Promise<{ error: Error | null }>
  /**
   * Creates a new user.
   * @param options The user login details.
   * @param options.email The user's email address.
   * @param options.password The user's password.
   */
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
    login: async ({ email, password, provider }) => {
      if (email && !password) {
        // magic link
        return await client.auth.signIn({ email })
      }
      // email and password
      if (email && password)
        return await client.auth.signIn({ email, password })
      // oauth, such as github, gitlab, etc.
      if (provider) return await client.auth.signIn({ provider })
      throw new Error(
        `You must provide either an email or a third-party provider.`
      )
    },
    logout: async () => await client.auth.signOut(),
    signup: async ({ email, password }) =>
      await client.auth.signUp({ email, password }),
    getToken: async () => {
      const currentSession = client.auth.session()
      return currentSession?.access_token || null
    },
    getUserMetadata: async () => await client.auth.user(),
    restoreAuthState: async () => await client.auth.refreshSession(),
  }
}
