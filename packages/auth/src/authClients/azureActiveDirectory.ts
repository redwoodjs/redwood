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

      try {
        const response = await client.acquireTokenSilent(renewIdTokenRequest)
        return response?.idToken?.rawIdToken || null
      } catch (error) {
        if (error.name === 'InteractionRequiredAuthError') {
          client.acquireTokenRedirect(renewIdTokenRequest)
        } else {
          console.error(`azureActiveDirectory: Uncaught exception`, error)
        }
      }

      return null
    },
    getUserMetadata: async () => (await client.getAccount()) || null,
  }
}
