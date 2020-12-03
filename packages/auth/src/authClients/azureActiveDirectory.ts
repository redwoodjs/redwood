import { UserAgentApplication as AzureActiveDirectory } from 'msal'

export type { AzureActiveDirectory }
import type { AuthClient } from './'

export type AzureActiveDirectoryClient = AzureActiveDirectory
export interface AzureActiveDirectoryUser {}

export const azureActiveDirectory = (client: AzureActiveDirectoryClient): AuthClient => {
  return {
    type: 'azureActiveDirectory',
    client,
    restoreAuthState: async () => {},
    login: async (options?) => await client.loginPopup(options),
    logout: (options?) => client.logout(options),
    signup: async (options?) => {
      await client.loginPopup(options)
    },
    getToken: async () => sessionStorage.getItem('msal.idtoken'),
    getUserMetadata: async () => {
      const user = await client.getAccount()
      return user || null
    },
  }
}
