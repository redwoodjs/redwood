import type { User, Session } from '@nhost/hasura-auth-js'
import type { NhostClient } from '@nhost/nhost-js'

import { AuthClient } from './'

export type Nhost = NhostClient
export type NhostUser = User

type NhostProvider = 'google' | 'github' | 'facebook' | 'linkedin'
export interface AuthClientNhost extends AuthClient {
  /**
   * Log In an existing user with email/password or via a OAuth provider
   * Log In via a OAuth provider also registers the account in case it doesn't exist
   * @param options.email The user's email address
   * @param options.password The user's password
   * @param options.provider One of NhostProvider
   */
  login(options: {
    email?: string
    password?: string
    provider?: NhostProvider
  }): Promise<{
    session: Session | null
    user: NhostUser | null
    mfa?: {
      ticket: string
    }
  }>
  logout(): Promise<void>
  /**
   * Creates a new user account
   * @param options.email The user's email address
   * @param options.password The user's password
   */
  signup(options: {
    email: string
    password: string
    registrationOptions?: {
      userData?: any
      defaultRole?: string
      allowedRoles?: string[]
    }
  }): Promise<{
    session: Session | null
    user: User | null
  }>

  getToken(): Promise<string | null>
  getUserMetadata(): Promise<NhostUser | null>
  restoreAuthState(): Promise<{
    session: Session | null
    user: NhostUser | null
  }>
  client: Nhost
}

export const nhost = (client: Nhost): AuthClient => {
  return {
    type: 'nhost',
    client,
    login: async ({ email, password, provider, options }) => {
      return await client.auth.signIn({ email, password, provider, options })
    },
    logout: async () => {
      return await client.auth.signOut()
    },
    signup: async ({ email, password }) => {
      return await client.auth.signUp({
        email,
        password,
        options: { metadata: { display_name: email } },
      })
    },
    getToken: async () => {
      return (await client.auth.getJWTToken()) || null
    },
    getUserMetadata: async () => {
      return await client.auth.getUser()
    },
    restoreAuthState: async () => {
      return await client.auth.refreshSession()
    },
  }
}
