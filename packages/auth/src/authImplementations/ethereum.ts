import { CurrentUser } from '../AuthContext'
import { createAuthentication } from '../authFactory'

import { AuthImplementation } from './AuthImplementation'

interface EthereumUser {
  address: string | null
}

interface Ethereum {
  login(options: unknown): Promise<any>
  logout(): Promise<any>
  getToken(): Promise<null | string>
  getUserMetadata(): Promise<null | EthereumUser>
}

type EthereumAuthImplementation = AuthImplementation<
  EthereumUser,
  never,
  any,
  any,
  never,
  never,
  never,
  never,
  never
>

const ethereumCreateAuthentication = (
  authImplementation: EthereumAuthImplementation,
  customProviderHooks?: {
    useCurrentUser?: () => Promise<Record<string, unknown>>
    useHasRole?: (
      currentUser: CurrentUser | null
    ) => (rolesToCheck: string | string[]) => boolean
  }
) => createAuthentication(authImplementation, customProviderHooks)

export function createEthereumAuth(
  ethereum: Ethereum,
  customProviderHooks?: {
    useCurrentUser?: () => Promise<Record<string, unknown>>
    useHasRole?: (
      currentUser: CurrentUser | null
    ) => (rolesToCheck: string | string[]) => boolean
  }
): ReturnType<typeof ethereumCreateAuthentication> {
  const authImplementation = createEthereumAuthImplementation(ethereum)

  return ethereumCreateAuthentication(authImplementation, customProviderHooks)
}

function createEthereumAuthImplementation(
  ethereum: Ethereum
): EthereumAuthImplementation {
  return {
    type: 'ethereum',
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
