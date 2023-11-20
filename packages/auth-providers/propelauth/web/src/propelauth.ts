import {
  IAuthClient,
  RedirectToLoginOptions,
  RedirectToSignupOptions,
} from '@propelauth/javascript'

import { createAuthentication } from '@redwoodjs/auth'

export function createAuth(authCleint: IAuthClient) {
  const authImplementation = createAuthImplementation(authCleint)

  return createAuthentication(authImplementation)
}

function createAuthImplementation(authClient: IAuthClient) {
  return {
    type: 'propelauth-redwoodjs',
    client: authClient,
    login: async (options?: RedirectToLoginOptions) => {
      return authClient.redirectToLoginPage(options)
    },
    logout: async (redirectAfterLogout: boolean) => {
      return await authClient.logout(redirectAfterLogout)
    },
    signup: async (options?: RedirectToSignupOptions) =>
      authClient.redirectToSignupPage(options),
    getToken: async (forceRefresh?: boolean) => {
      const authenticationInfo = await authClient.getAuthenticationInfoOrNull(
        forceRefresh
      )
      return authenticationInfo?.accessToken ?? null
    },
    getUserMetadata: async () => {
      const authenticationInfo = await authClient.getAuthenticationInfoOrNull()
      if (authenticationInfo) {
        return {
          user: authenticationInfo.user,
          orgIdToOrgMemberInfo: authenticationInfo.orgIdToOrgMemberInfo,
        }
      }
      return null
    },
  }
}
