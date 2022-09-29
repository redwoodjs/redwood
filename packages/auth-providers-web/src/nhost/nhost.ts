import type { SignInParams, SignUpParams } from '@nhost/hasura-auth-js'
import type { NhostClient } from '@nhost/nhost-js'

import { CurrentUser, createAuthentication } from '@redwoodjs/auth'

export function createNhostAuth(
  nhostClient: NhostClient,
  customProviderHooks?: {
    useCurrentUser?: () => Promise<Record<string, unknown>>
    useHasRole?: (
      currentUser: CurrentUser | null
    ) => (rolesToCheck: string | string[]) => boolean
  }
) {
  const authImplementation = createNhostAuthImplementation(nhostClient)

  return createAuthentication(authImplementation, customProviderHooks)
}

function createNhostAuthImplementation(nhostClient: NhostClient) {
  return {
    type: 'nhost',
    client: nhostClient,
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
      return nhostClient.auth.getJWTToken() || null
    },
    getUserMetadata: async () => {
      return nhostClient.auth.getUser()
    },
    restoreAuthState: () => {
      return nhostClient.auth.refreshSession()
    },
  }
}
