import {
  AccessToken,
  CustomUserClaims,
  OktaAuth,
  SigninWithRedirectOptions,
  UserClaims,
} from '@okta/okta-auth-js'

import { CurrentUser } from 'src/AuthContext'
import { createAuthentication } from 'src/authFactory'

import { AuthImplementation } from './AuthImplementation'

type OktaAuthImplementation = AuthImplementation<
  UserClaims<CustomUserClaims>,
  void,
  void,
  void,
  void,
  never,
  never,
  never,
  never
>

const oktaCreateAuthentication = (
  authImplementation: OktaAuthImplementation,
  customProviderHooks?: {
    useCurrentUser?: () => Promise<Record<string, unknown>>
    useHasRole?: (
      currentUser: CurrentUser | null
    ) => (rolesToCheck: string | string[]) => boolean
  }
) => createAuthentication(authImplementation, customProviderHooks)

export function createNetlifyAuth(
  oktaAuth: OktaAuth,
  customProviderHooks?: {
    useCurrentUser?: () => Promise<Record<string, unknown>>
    useHasRole?: (
      currentUser: CurrentUser | null
    ) => (rolesToCheck: string | string[]) => boolean
  }
): ReturnType<typeof oktaCreateAuthentication> {
  const authImplementation = createOktaAuthImplementation(oktaAuth)

  return oktaCreateAuthentication(authImplementation, customProviderHooks)
}

function createOktaAuthImplementation(
  oktaAuth: OktaAuth
): OktaAuthImplementation {
  return {
    type: 'okta',
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
