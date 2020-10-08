import { UserAgentApplication } from 'msal'

export type AzureAdClient = typeof UserAgentApplication

import { AuthClient } from './'

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
