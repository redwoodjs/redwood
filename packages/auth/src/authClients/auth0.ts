import type {
  Auth0Client as Auth0,
  LogoutOptions,
  RedirectLoginOptions,
} from '@auth0/auth0-spa-js'

export type { Auth0 }

// TODO: Map out this user properly.
export interface Auth0User {}

export const auth0 = (client: Auth0) => {
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
    login: (options?: RedirectLoginOptions) =>
      client.loginWithRedirect(options),
    logout: (options?: LogoutOptions) => client.logout(options),
    signup: (options?: RedirectLoginOptions) =>
      client.loginWithRedirect({
        ...options,
        screen_hint: 'signup',
        prompt: 'login',
      }),
    getToken: () => client.getTokenSilently(),
    getUserMetadata: async () => {
      const user = await client.getUser()
      return user || null
    },
  } as const
}
