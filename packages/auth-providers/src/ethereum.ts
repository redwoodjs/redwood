import type { CurrentUser } from '@redwoodjs/auth'
import { createAuthentication } from '@redwoodjs/auth'

export interface EthereumUser {
  address: string | null
}

export interface Ethereum {
  login(options: unknown): Promise<any>
  logout(): Promise<any>
  getToken(): Promise<null | string>
  getUserMetadata(): Promise<null | EthereumUser>
}

export function createEthereumAuth(
  ethereum: Ethereum,
  customProviderHooks?: {
    useCurrentUser?: () => Promise<Record<string, unknown>>
    useHasRole?: (
      currentUser: CurrentUser | null
    ) => (rolesToCheck: string | string[]) => boolean
  }
) {
  const authImplementation = createEthereumAuthImplementation(ethereum)

  return createAuthentication(authImplementation, customProviderHooks)
}

function createEthereumAuthImplementation(ethereum: Ethereum) {
  return {
    type: 'ethereum',
    client: ethereum || (window as any).ethereumRwClient,
    login: async (options?: unknown) => await ethereum.login(options),
    signup: () => {
      throw new Error(
        `Ethereum auth does not support "signup". Please use "login" instead.`
      )
    },
    logout: async () => await ethereum.logout(),
    getToken: async () => await ethereum.getToken(),
    getUserMetadata: async () => await ethereum.getUserMetadata(),
  }
}
