import { KeycloakClient as Keycloak } from '@react-keycloak/keycloak-ts'

import { AuthClient } from '.'

export type { Keycloak }

// TODO: Map out this user properly
export interface KeycloakUser {}

export interface KeycloakClient extends AuthClient {
  client: Keycloak
  type: 'keycloak'
}

export const keycloak = (client: Keycloak): KeycloakClient => {
  return {
    type: 'keycloak',
    client: client,
    restoreAuthState: async () => {},
    login: async (options?) => client.login(options),
    logout: (options?) => client.logout(options),
    signup: async (options?) => client.login(options),
    getToken: async () => client.token || null,
    getUserMetadata: async () => {
      const user = await client.loadUserInfo()
      return (user as KeycloakUser) || null
    },
  }
}
