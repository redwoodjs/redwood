import type { default as GoTrue } from 'gotrue-js'
import type { User } from 'gotrue-js'

import { CurrentUser } from 'src/AuthContext'
import { createAuthentication } from 'src/authFactory'

import { AuthImplementation } from './AuthImplementation'

export type GoTrueUser = User

interface LogInSignUpOptions {
  email: string
  password: string
  remember?: boolean
}

type GoTrueAuthImplementation = AuthImplementation<
  User,
  never,
  User,
  void | undefined,
  User,
  never,
  never,
  never,
  never
>

const goTrueCreateAuthentication = (
  authImplementation: GoTrueAuthImplementation,
  customProviderHooks?: {
    useCurrentUser?: () => Promise<Record<string, unknown>>
    useHasRole?: (
      currentUser: CurrentUser | null
    ) => (rolesToCheck: string | string[]) => boolean
  }
) => createAuthentication(authImplementation, customProviderHooks)

export function createGoTrueAuth(
  goTrue: GoTrue,
  customProviderHooks?: {
    useCurrentUser?: () => Promise<Record<string, unknown>>
    useHasRole?: (
      currentUser: CurrentUser | null
    ) => (rolesToCheck: string | string[]) => boolean
  }
): ReturnType<typeof goTrueCreateAuthentication> {
  const authImplementation = createGoTrueAuthImplementation(goTrue)

  return goTrueCreateAuthentication(authImplementation, customProviderHooks)
}

function createGoTrueAuthImplementation(
  goTrue: GoTrue
): GoTrueAuthImplementation {
  return {
    type: 'goTrue',
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
