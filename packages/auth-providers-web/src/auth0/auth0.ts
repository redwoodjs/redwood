import type {
  Auth0Client,
  LogoutOptions,
  RedirectLoginOptions,
} from '@auth0/auth0-spa-js'

import { CurrentUser, createAuthentication } from '@redwoodjs/auth'

// TODO: Map out this user properly.
export interface Auth0User {}

export function createAuth0Auth(
  auth0Client: Auth0Client,
  customProviderHooks?: {
    useCurrentUser?: () => Promise<Record<string, unknown>>
    useHasRole?: (
      currentUser: CurrentUser | null
    ) => (rolesToCheck: string | string[]) => boolean
  }
) {
  const authImplementation = createAuth0AuthImplementation(auth0Client)

  return createAuthentication(authImplementation, customProviderHooks)
}

function createAuth0AuthImplementation(auth0Client: Auth0Client) {
  return {
    type: 'auth0',
    client: auth0Client,
    restoreAuthState: async () => {
      if (
        global?.location?.search?.includes('code=') &&
        global?.location?.search?.includes('state=')
      ) {
        const { appState } = await auth0Client.handleRedirectCallback()
        const url =
          appState && appState.targetUrl
            ? appState.targetUrl
            : window.location.pathname
        global?.location?.assign(url)
      }
    },
    login: async (options?: RedirectLoginOptions) =>
      auth0Client.loginWithRedirect(options),
    logout: async (options?: LogoutOptions) => auth0Client.logout(options),
    signup: async (options?: RedirectLoginOptions) =>
      auth0Client.loginWithRedirect({
        ...options,
        screen_hint: 'signup',
        prompt: 'login',
      }),
    getToken: () => auth0Client.getTokenSilently(),
    getUserMetadata: async () => {
      const user = await auth0Client.getUser()
      return user || null
    },
  }
}
