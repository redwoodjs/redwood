import type {
  EndSessionRequest,
  PublicClientApplication as AzureActiveDirectory,
  RedirectRequest,
  SilentRequest,
} from '@azure/msal-browser'

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
    login: async (options?: RedirectRequest) => client.loginRedirect(options),
    logout: (options?: EndSessionRequest) => client.logoutRedirect(options),
    signup: async (options?: RedirectRequest) => client.loginRedirect(options),
    getToken: async (options?: SilentRequest) => {
      try {
        // Acquire id token silently
        const token = await client.acquireTokenSilent(
          options || { scopes: ['openid', 'profile'] }
        )

        return token.idToken
      } catch (err) {
        console.error(`An exception caught while trying to obtain token`, err)

        return null
      }
    },
    restoreAuthState: async () => {
      // As we are using the redirect flow, we need to call handleRedirectPromise
      // to complete the flow. As this only should happen on a valid redirect, I think
      // it makes sense to call this in the restoreAuthState method.
      if (window.location.href.includes('#code=')) {
        // Wait for promise
        await client.handleRedirectPromise()

        // Try get all accounts
        const accounts = client.getAllAccounts()

        if (accounts.length === 0) {
          // No accounts, so we need to login
          client.loginRedirect()
        } else if (accounts.length === 1) {
          // We have one account, so we can set it as active
          client.setActiveAccount(accounts[0])
        } else {
          // We recieved multiple accounts, so we need to ask the user which one to use
          client.loginRedirect()
        }
      }
    },
    getUserMetadata: async () => {
      return client.getActiveAccount()
    },
  }
}
