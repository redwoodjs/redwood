import type {
  User,
  Session,
  SignInParams,
  SignUpParams,
} from '@nhost/hasura-auth-js'
import type { NhostClient } from '@nhost/nhost-js'

import { AuthClient } from './'

export type Nhost = NhostClient
export type NhostUser = User

export interface AuthClientNhost extends AuthClient {
  /**
   * Log In an existing user with email/password, magiclink, sms or via a OAuth provider
   * Log In via a OAuth provider also creates the account in case it doesn't exist
   *
   * https://github.com/nhost/nhost/blob/main/packages/hasura-auth-js/src/utils/types.ts#L104
   * @param options.SignInParams
   */
  login(options: SignInParams): Promise<{
    session: Session | null
    mfa?: {
      ticket: string
    }
    providerUrl?: string
    provider?: string
    error: { message: string; status: number } | null
  }>
  logout(): Promise<void>
  /**
   * Creates a new user account
   *
   * https://github.com/nhost/nhost/blob/main/packages/hasura-auth-js/src/utils/types.ts#L39
   * @param options.SignUpParams
   */
  signup(options: SignUpParams): Promise<{
    session: Session | null
    error: { message: string; status: number } | null
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
    login: async (options: SignInParams) => {
      return await client.auth.signIn(options)
    },
    logout: async () => {
      return await client.auth.signOut()
    },
    signup: async (options: SignUpParams) => {
      return await client.auth.signUp(options)
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
