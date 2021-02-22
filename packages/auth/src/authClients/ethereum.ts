export type EthereumUser = {
  address: string | null
}

export type Ethereum = {
  login(options: any): Promise<any>
  logout(): Promise<any>
  getToken(): Promise<null | string>
  getUserMetadata(): Promise<null | EthereumUser>
}

import type { AuthClient } from './'

export const ethereum = (client: Ethereum): AuthClient => {
  return {
    type: 'ethereum',
    client,
    login: async (options?) => await client.login(options),
    signup: () => {
      throw new Error(
        `Ethereum auth does not support "signup". Please use "login" instead.`
      )
    },
    logout: async () => await client.logout(),
    getToken: async () => await client.getToken(),
    getUserMetadata: async () => await client.getUserMetadata(),
  }
}
