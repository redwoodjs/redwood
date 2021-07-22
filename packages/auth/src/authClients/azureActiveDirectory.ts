import type { UserAgentApplication as AzureActiveDirectory } from 'msal'

import type { AuthClient } from './'

export type { AzureActiveDirectory }

export type AzureActiveDirectoryClient = AzureActiveDirectory
export interface AzureActiveDirectoryUser {}

export const azureActiveDirectory = (
  client: AzureActiveDirectoryClient
): AuthClient => {
  return {
    type: 'azureActiveDirectory',
    client,
    login: async (options?) => await client.loginPopup(options),
    logout: (options?) => client.logout(options),
    signup: async (options?) => await client.loginPopup(options),
    getToken: async (options?: any) => {
      const authRequest = options || {
        scopes: ['openid', 'profile'],
      }

      // The recommended call pattern is to first try to call AcquireTokenSilent,
      // and if it fails with a MsalUiRequiredException, call AcquireTokenXYZ
      // https://github.com/AzureAD/microsoft-authentication-library-for-dotnet/wiki/AcquireTokenSilentAsync-using-a-cached-token
      // NOTE: We are not catching by the `MsalUiRequiredException`, perhaps we can branch off `error.name`
      // if this strategy doesn't work properly.
      try {
        const response = await client.acquireTokenSilent(authRequest)
        return response?.idToken?.rawIdToken || null
      } catch (error) {
        client.acquireTokenRedirect(authRequest)
      }

      return null
    },
    getUserMetadata: async () => (await client.getAccount()) || null,
  }
}
