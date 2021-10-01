import type { PublicClientApplication as AzureActiveDirectory } from '@azure/msal-browser'

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
    login: async (options?) => client.loginRedirect(options),
    logout: (options?) => client.logoutRedirect(options),
    signup: async (options?) => client.loginRedirect(options),
    getToken: async (options?: any) => {
      const token = await client.acquireTokenSilent(options)

      return token.accessToken || null

      //return null
    },
    restoreAuthState: async (options?: any) => {
      // As we are using the redirect flow, we need to call handleRedirectPromise
      // to complete the flow. As this only should happen on a valid redirect, I think
      // it makes sense to call this in the restoreAuthState.

      if (window.location.href.includes('#code=')) {
        const response = await client.handleRedirectPromise()

        console.log(`[AAD:restoreAuthState:debug] Response`, response)

        // Try get all accounts
        const accounts = client.getAllAccounts()
        console.log(`[AAD:restoreAuthState:debug] Accounts`, accounts)

        if (accounts.length === 0) {
          // Debug
          console.log(
            `[AAD:restoreAuthState:debug]: We got 0 account, which is odd since we got a #code= back, but hey; let's send a login request.`
          )

          // No accounts, so we need to login
          client.loginRedirect(options)
        } else if (accounts.length === 1) {
          // Debug
          console.log(`[AAD:restoreAuthState:debug]: We got 1 account`)

          // We have one account, so we can set it as active
          client.setActiveAccount(accounts[0])
        } else {
          // Debug
          console.log(
            `[AAD:restoreAuthState:debug]: We got multiple accounts. For now, create a new login request so the user to choose one`
          )

          // We have multiple accounts, so we need to ask the user which one to use
          client.loginRedirect(options)
        }
      }
    },
    getUserMetadata: async () => {
      console.log(`[AAD:debug] getUserMetadata`)

      return {
        status: 'Not implemented',
      }
    },
  }
}
