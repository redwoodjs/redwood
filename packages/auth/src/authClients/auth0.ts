import type { Auth0Client as Auth0 } from '@auth0/auth0-spa-js'

import type { AuthClient } from './'

export type AuthClientAuth0 = AuthClient

export type { Auth0 }

// TODO: Map out this user properly.
export interface Auth0User {}

export const auth0 = (client: Auth0): AuthClientAuth0 => {
  return {
    type: 'auth0',
    client,
    restoreAuthState: async () => {
      if (window.location.search.includes('code=')) {
        const { appState } = await client.handleRedirectCallback()
        window.history.replaceState(
          {},
          document.title,
          appState && appState.targetUrl
            ? appState.targetUrl
            : window.location.pathname
        )
      }
    },
    login: async () => client.loginWithRedirect(),
    logout: (options?) => client.logout(options),
    getToken: async () => client.getTokenSilently(),
    getUserMetadata: async () => {
      const user = await client.getUser()
      return user || null
    },
  }
}
