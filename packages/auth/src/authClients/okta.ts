import { OktaAuth as Okta } from '@okta/okta-auth-js'

import type { AuthClient } from './'

export type AuthClientOkta = AuthClient

export type { Okta }

export interface OktaUser extends AuthClient {
  /**
   * Log in an existing user, or login via a third-party provider.
   *
   */
}

export const okta = (client: Okta): AuthClientOkta => {
  return {
    type: 'okta',
    client,
    restoreAuthState: async () => {
      const previousState = client.authStateManager.getPreviousAuthState()

      if (client.isLoginRedirect() && !previousState) {
        try {
          client.storeTokensFromRedirect()
        } catch (e) {
          console.error(e)
        }
      } else if (!(await client.isAuthenticated())) {
        client.signInWithRedirect()
      }
    },
    login: async (options?) => client.signInWithRedirect(options),
    logout: () => client.signOut(),
    signup: async (options?) => client.signInWithRedirect(options),
    getToken: async () =>
      client.tokenManager.get('accessToken').then((res: any) => {
        return res.accessToken
      }),
    getUserMetadata: async () => {
      const user = client.token.getUserInfo()
      return user || null
    },
  }
}
