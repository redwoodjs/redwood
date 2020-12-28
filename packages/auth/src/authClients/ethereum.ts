// import type { Ethereum, EthereumUser } from 'ethereumAuthClient'
export type Ethereum = any
export type EthereumUser = any

export interface EthereumUser {
  address: string | null
}

import type { AuthClient } from './'

export const ethereum = (client: Ethereum): AuthClient => {
  return {
    type: 'ethereum',
    client,
    login: async () => await client.login(),
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
