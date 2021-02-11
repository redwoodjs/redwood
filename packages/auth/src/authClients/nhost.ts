import type { Session, NhostClient, User } from 'nhost-js-sdk'

export type Nhost = NhostClient
export type NhostUser = User

import { AuthClient } from './'
export interface AuthClientNhost extends AuthClient {
  login(options: {
    email?: string
    password?: string
    provider?: string
  }): Promise<{
    session: Session | null
    user: NhostUser | null
    mfa?: {
      ticket: string
    }
  }>
  logout(): Promise<void>
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
        registrationOptions: { userData: { display_name: email } },
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
