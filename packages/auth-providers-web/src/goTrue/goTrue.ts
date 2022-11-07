import type { default as GoTrue } from 'gotrue-js'
import type { User } from 'gotrue-js'

import { CurrentUser, createAuthentication } from '@redwoodjs/auth'

export type GoTrueUser = User

interface LogInSignUpOptions {
  email: string
  password: string
  remember?: boolean
}

export function createGoTrueAuth(
  goTrue: GoTrue,
  customProviderHooks?: {
    useCurrentUser?: () => Promise<Record<string, unknown>>
    useHasRole?: (
      currentUser: CurrentUser | null
    ) => (rolesToCheck: string | string[]) => boolean
  }
) {
  const authImplementation = createGoTrueAuthImplementation(goTrue)

  return createAuthentication(authImplementation, customProviderHooks)
}

function createGoTrueAuthImplementation(goTrue: GoTrue) {
  return {
    type: 'goTrue',
    client: goTrue,
    login: ({ email, password, remember }: LogInSignUpOptions) =>
      goTrue.login(email, password, remember),
    logout: async () => {
      const user = await goTrue.currentUser()
      return user?.logout()
    },
    signup: ({ email, password, remember }: LogInSignUpOptions) =>
      goTrue.signup(email, password, remember),
    getToken: async () => {
      try {
        const user = await goTrue.currentUser()
        return user?.jwt() || null
      } catch {
        return null
      }
    },
    getUserMetadata: async () => goTrue.currentUser(),
  }
}
