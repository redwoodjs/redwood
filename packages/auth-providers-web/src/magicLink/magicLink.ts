import type { Magic } from 'magic-sdk'

import { CurrentUser, createAuthentication } from '@redwoodjs/auth'

const TEN_MINUTES = 10 * 60 * 1000

export function createMagicLinkAuth(
  magic: Magic,
  customProviderHooks?: {
    useCurrentUser?: () => Promise<Record<string, unknown>>
    useHasRole?: (
      currentUser: CurrentUser | null
    ) => (rolesToCheck: string | string[]) => boolean
  }
) {
  const authImplementation = createMagicLinkAuthImplementation(magic)

  return createAuthentication(authImplementation, customProviderHooks)
}

interface LogInSignUpOptions {
  email: string
  showUI?: boolean
}

function createMagicLinkAuthImplementation(magic: Magic) {
  let token: string | null
  let expireTime = 0

  return {
    type: 'magicLink',
    client: magic,
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
