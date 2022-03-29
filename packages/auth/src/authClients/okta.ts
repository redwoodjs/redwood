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
      if (client.isLoginRedirect()) {
        const state = await client.handleLoginRedirect()
        console.log('state: ' + state)
      } else if (
        global?.location?.search?.includes('code=') &&
        global?.location?.search?.includes('state=')
      ) {
        console.log('test')
      } else if (!(await client.isAuthenticated)) {
        client.signInWithRedirect()
      }
    },
    login: async (options?) => client.signInWithRedirect(options),
    logout: (options?) => client.signOut(options),
    signup: async (options?) => client.signInWithRedirect(options),
    getToken: async () => client.tokenManager.get('accessToken'),
    getUserMetadata: async () => {
      const user = client.token.getUserInfo()
      return user || null
    },
  }
}
