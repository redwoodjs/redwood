import type { Session, NhostClient, User } from 'nhost-js-sdk'

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
    login: async ({ email, password, provider }) => {
      if (email && password) {
        return await client.auth.login({ email, password })
      }

      if (provider) {
        return await client.auth.login({ provider })
      }

      throw new Error(
        'You must provide an email/password or a third-party OAuth provider.'
      )
    },
    logout: async () => {
      return await client.auth.logout()
    },
    signup: async ({ email, password }) => {
      return await client.auth.register({
        email,
        password,
        options: { userData: { display_name: email } },
      })
    },
    getToken: async () => {
      return await client.auth.getJWTToken()
    },
    getUserMetadata: async () => {
      return await client.auth.user()
    },
    restoreAuthState: async () => {
      return await client.auth.refreshSession()
    },
  }
}
