import {
  AccessToken,
  OktaAuth,
  SigninWithRedirectOptions,
} from '@okta/okta-auth-js'

import { CurrentUser, createAuthentication } from '@redwoodjs/auth'

export function createOktaAuth(
  oktaAuth: OktaAuth,
  customProviderHooks?: {
    useCurrentUser?: () => Promise<Record<string, unknown>>
    useHasRole?: (
      currentUser: CurrentUser | null
    ) => (rolesToCheck: string | string[]) => boolean
  }
) {
  const authImplementation = createOktaAuthImplementation(oktaAuth)

  return createAuthentication(authImplementation, customProviderHooks)
}

function createOktaAuthImplementation(oktaAuth: OktaAuth) {
  return {
    type: 'okta',
    client: oktaAuth,
    restoreAuthState: async () => {
      const previousState = oktaAuth.authStateManager.getPreviousAuthState()

      if (oktaAuth.isLoginRedirect() && !previousState) {
        try {
          oktaAuth.storeTokensFromRedirect()
        } catch (e) {
          console.error(e)
        }
      } else if (!(await oktaAuth.isAuthenticated())) {
        oktaAuth.signInWithRedirect()
      }
    },
    /** Log in an existing user, or login via a third-party provider */
    login: (options?: SigninWithRedirectOptions) =>
      oktaAuth.signInWithRedirect(options),
    logout: () => oktaAuth.signOut(),
    signup: (options?: SigninWithRedirectOptions) =>
      oktaAuth.signInWithRedirect(options),
    getToken: () =>
      oktaAuth.tokenManager.get('accessToken').then((res: AccessToken) => {
        return res.accessToken
      }),
    getUserMetadata: async () => {
      const user = oktaAuth.token.getUserInfo()
      return user || null
    },
  }
}
