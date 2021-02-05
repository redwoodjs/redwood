import { Session, User, Provider } from '@supabase/gotrue-js'
import type { SupabaseClient } from '@supabase/supabase-js'

import type { AuthClient } from './index'
export type Supabase = SupabaseClient
export type SupabaseUser = User

export interface AuthClientSupabase extends AuthClient {
  /**
   * Log in an existing user, or login via a third-party provider.
   * @param options The user login details.
   * @param options.email The user's email address.
   * @param options.password The user's password.
   * @param {'azure' | 'bitbucket' | 'facebook' | 'github' | 'gitlab' | 'google' } options.provider One of the providers supported by GoTrue.
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
      // magic link
      if (email && !password) {
        return await client.auth.signIn({ email })
      }
      // email and password
      if (email && password) {
        return await client.auth.signIn({ email, password })
      }
      // oauth, such as github, gitlab, bitbucket, google, azure etc.
      if (provider) return await client.auth.signIn({ provider })
      throw new Error(
        `You must provide either an email or a third-party provider.`
      )
    },
    logout: async () => {
      return await client.auth.signOut()
    },
    signup: async ({ email, password }) => {
      return await client.auth.signUp({ email, password })
    },

    getToken: async () => {
      const currentSession = client.auth.session()
      return currentSession?.access_token || null
    },
    getUserMetadata: async () => {
      return await client.auth.user()
    },
    // restore authentication when an OAuth or magiclink callback
    // redirects back to site with access token
    restoreAuthState: async () => {
      return await client.auth.refreshSession()
    },
  }
}
