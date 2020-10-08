import { UserAgentApplication as AzureAd } from 'msal'

export type { AzureAd }
import type { AuthClient } from './'

export type AzureAdClient = AzureAd

export const azureAd = (client: AzureAdClient): AuthClient => {
  return {
    type: 'azureAd',
    client,
    restoreAuthState: async () => {},
    login: async (options?) => {
      await client.loginPopup(options)
    },
    logout: (options?) => client.logout(options),
    signup: async (options?) => {
      await client.loginPopup(options)
    },
    getToken: async () => {
      return sessionStorage.getItem('msal.idtoken')
    },
    getUserMetadata: async () => {
      const user = await client.getAccount()
      return user || null
    },
  }
}
