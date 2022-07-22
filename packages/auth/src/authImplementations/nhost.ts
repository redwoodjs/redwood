import type {
  User,
  SignInParams,
  SignUpParams,
  HasuraAuthClient,
  SignInResponse,
  ApiSignOutResponse,
  SignUpResponse,
} from '@nhost/hasura-auth-js'
import type { NhostClient } from '@nhost/nhost-js'

import { CurrentUser } from 'src/AuthContext'
import { createAuthentication } from 'src/authFactory'

import { AuthImplementation } from './AuthImplementation'

type TRestoreAuth = Awaited<ReturnType<HasuraAuthClient['refreshSession']>>

type NhostAuthImplementation = AuthImplementation<
  User,
  TRestoreAuth,
  SignInResponse,
  ApiSignOutResponse,
  SignUpResponse,
  never,
  never,
  never,
  never
>

const nHostCreateAuthentication = (
  authImplementation: NhostAuthImplementation,
  customProviderHooks?: {
    useCurrentUser?: () => Promise<Record<string, unknown>>
    useHasRole?: (
      currentUser: CurrentUser | null
    ) => (rolesToCheck: string | string[]) => boolean
  }
) => createAuthentication(authImplementation, customProviderHooks)

export function createNhostAuth(
  nhostClient: NhostClient,
  customProviderHooks?: {
    useCurrentUser?: () => Promise<Record<string, unknown>>
    useHasRole?: (
      currentUser: CurrentUser | null
    ) => (rolesToCheck: string | string[]) => boolean
  }
): ReturnType<typeof nHostCreateAuthentication> {
  const authImplementation = createNhostAuthImplementation(nhostClient)

  return nHostCreateAuthentication(authImplementation, customProviderHooks)
}

function createNhostAuthImplementation(
  nhostClient: NhostClient
): NhostAuthImplementation {
  return {
    type: 'nhost',
    /**
     * Log In an existing user with email/password, magicLink, sms or via a OAuth provider
     * Log In via a OAuth provider also creates the account in case it doesn't exist
     *
     * https://github.com/nhost/nhost/blob/main/packages/hasura-auth-js/src/utils/types.ts#L104
     * @param options.SignInParams
     */
    login: (options: SignInParams) => {
      return nhostClient.auth.signIn(options)
    },
    logout: () => {
      return nhostClient.auth.signOut()
    },
    /**
     * Creates a new user account
     *
     * https://github.com/nhost/nhost/blob/main/packages/hasura-auth-js/src/utils/types.ts#L39
     * @param options.SignUpParams
     */
    signup: (options: SignUpParams) => {
      return nhostClient.auth.signUp(options)
    },
    getToken: async () => {
      return (await nhostClient.auth.getJWTToken()) || null
    },
    getUserMetadata: async () => {
      return await nhostClient.auth.getUser()
    },
    restoreAuthState: () => {
      return nhostClient.auth.refreshSession()
    },
  }
}
