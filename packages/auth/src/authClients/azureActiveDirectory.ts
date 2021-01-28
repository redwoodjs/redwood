import type { UserAgentApplication as AzureActiveDirectory } from 'msal'

export type { AzureActiveDirectory }
import type { AuthClient } from './'

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
      const renewIdTokenRequest = options || {
        scopes: [process.env.AZURE_ACTIVE_DIRECTORY_CLIENT_ID],
      }

      // The recommended call pattern is to first try to call AcquireTokenSilent,
      // and if it fails with a MsalUiRequiredException, call AcquireTokenXYZ
      // https://github.com/AzureAD/microsoft-authentication-library-for-dotnet/wiki/AcquireTokenSilentAsync-using-a-cached-token
      // NOTE: We are not catching by the `MsalUiRequiredException`, perhaps we can branch off `error.name`
      // if this strategy doesn't work properly.
      try {
        const response = await client.acquireTokenSilent(renewIdTokenRequest)
        return response?.idToken?.rawIdToken || null
      } catch (error) {
        client.acquireTokenRedirect(renewIdTokenRequest)
      }

      return null
    },
    getUserMetadata: async () => (await client.getAccount()) || null,
  }
}
