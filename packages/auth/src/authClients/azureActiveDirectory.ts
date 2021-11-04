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
      // Default scopes if options is not passed
      const request = options || {
        scopes: ['openid', 'profile'],
      }

      // The recommended call pattern is to first try to call acquireTokenSilent,
      // and if it fails with a InteractionRequiredAuthError, call acquireTokenRedirect
      // https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/acquire-token.md
      // NOTE: We are not catching by the `InteractionRequiredAuthError`, perhaps we
      // can branch off `error.name` if this strategy doesn't work properly.
      try {
        const token = await client.acquireTokenSilent(request)
        return token.idToken
      } catch (err) {
        client.acquireTokenRedirect(request)
      }

      return null
    },
    getUserMetadata: async () => {
      return client.getActiveAccount()
    },
    restoreAuthState: async () => {
      // As we are using the redirect flow, we need to call and wait for handleRedirectPromise to complete.
      // This should only happen on a valid redirect, and having it in the restoreAuthState makes sense for now.
      // https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/v1-migration.md#3-update-your-code
      if (window.location.href.includes('#code=')) {
        // Wait for promise
        await client.handleRedirectPromise()

        // Get accounts
        const accounts = client.getAllAccounts()

        switch (accounts.length) {
          case 0:
            // No accounts so we need to login
            client.loginRedirect()
            break

          case 1:
            // We have one account so we can set it as active
            client.setActiveAccount(accounts[0])
            break

          default:
            // We most likely have multiple accounts so we need to ask the user which one to use
            client.loginRedirect()
        }
      }
    },
  }
}
