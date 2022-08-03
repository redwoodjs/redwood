import type { Magic, MagicUserMetadata } from 'magic-sdk'

import { CurrentUser } from '../AuthContext'
import { createAuthentication } from '../authFactory'

import { AuthImplementation } from './AuthImplementation'

const TEN_MINUTES = 10 * 60 * 1000

type MagicLinkAuthImplementation = AuthImplementation<
  MagicUserMetadata,
  never,
  string | null,
  boolean,
  string | null,
  never,
  never,
  never
>

const magicLinkCreateAuthentication = (
  authImplementation: MagicLinkAuthImplementation,
  customProviderHooks?: {
    useCurrentUser?: () => Promise<Record<string, unknown>>
    useHasRole?: (
      currentUser: CurrentUser | null
    ) => (rolesToCheck: string | string[]) => boolean
  }
) => createAuthentication(authImplementation, customProviderHooks)

export function createMagicLinkAuth(
  magic: Magic,
  customProviderHooks?: {
    useCurrentUser?: () => Promise<Record<string, unknown>>
    useHasRole?: (
      currentUser: CurrentUser | null
    ) => (rolesToCheck: string | string[]) => boolean
  }
): ReturnType<typeof magicLinkCreateAuthentication> {
  const authImplementation = createMagicLinkAuthImplementation(magic)

  return magicLinkCreateAuthentication(authImplementation, customProviderHooks)
}

interface LogInSignUpOptions {
  email: string
  showUI?: boolean
}

function createMagicLinkAuthImplementation(
  magic: Magic
): MagicLinkAuthImplementation {
  let token: string | null
  let expireTime = 0

  return {
    type: 'magicLink',
    login: async ({ email, showUI = true }: LogInSignUpOptions) =>
      await magic.auth.loginWithMagicLink({ email, showUI }),
    logout: async () => {
      token = null
      expireTime = 0

      return await magic.user.logout()
    },
    signup: async ({ email, showUI = true }: LogInSignUpOptions) =>
      await magic.auth.loginWithMagicLink({ email, showUI }),
    getToken: async () => {
      if (!token || Date.now() > expireTime) {
        expireTime = Date.now() + TEN_MINUTES

        return (token = await magic.user.getIdToken())
      } else {
        return token
      }
    },
    getUserMetadata: async () =>
      (await magic.user.isLoggedIn()) ? await magic.user.getMetadata() : null,
  }
}
