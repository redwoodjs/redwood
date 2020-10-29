import type { Auth0Client, RedirectLoginOptions } from '@auth0/auth0-spa-js'

export const auth0 = (client: Auth0Client) => {
  return {
    type: 'auth0',
    client,
    async restoreAuthState() {
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
    login: client.loginWithRedirect,
    logout: client.logout,
    signup: async (options?: RedirectLoginOptions) =>
      client.loginWithRedirect({
        ...options,
        screen_hint: 'signup',
        prompt: 'login',
      }),
    getToken: async () => client.getTokenSilently(),
    getUserMetadata: client.getUser,
  }
}
