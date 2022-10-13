export type Custom = any

import { AuthClient } from './'

export interface AuthClientCustom extends AuthClient {
  client: Custom
  type: 'custom'
}

export const custom = (authClient: AuthClientCustom) => authClient
