import type { NhostClient, User } from 'nhost-js-sdk'

export type Nhost = NhostClient
export type NhostUser = User

import { AuthClient } from './'

export const nhost = (client: Nhost): AuthClient => {
  return {
    type: 'nhost',
    client,
    login: async ({ email, password, provider }) => {
      if (email && password) {
        return await client.auth.login({ email, password })
      }

      if (provider) {
        return await client.auth.login({ provider })
      }

      throw new Error(
        'You must provide an email/password or a third-party OAuth provider.'
      )
    },
    logout: async () => {
      return await client.auth.logout()
    },
    signup: async ({ email, password }) => {
      return await client.auth.register(email, password, {
        userData: { display_name: email },
      })
    },
    getToken: async () => {
      return await client.auth.getJWTToken()
    },
    getUserMetadata: async () => {
      return await client.auth.user()
    },
    restoreAuthState: async () => {
      return await client.auth.refreshSession()
    },
  }
}
