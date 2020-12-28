// import type { Ethereum, EthereumUser } from 'ethereumAuthClient'
type Ethereum = any
type EthereumUser = any

export type Ethereum = Ethereum
export type EthereumUser = EthereumUser

import type { AuthClient } from './'

export const ethereumAuth = (client: Ethereum): AuthClient => {
  return {
    type: 'ethereum',
    client,
    login: async () => await client.login(),
    logout: async () => await client.logout(),
    getToken: async () => await client.getToken(),
    getUserMetadata: async () => await client.getUserMetadata(),
  }
}
