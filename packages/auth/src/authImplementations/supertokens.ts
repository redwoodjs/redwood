import { CurrentUser } from '../AuthContext'
import { createAuthentication } from '../authFactory'

import { AuthImplementation } from './AuthImplementation'

export interface SuperTokensUser {
  userId: string
  accessTokenPayload: any
}

type SessionRecipe = {
  signOut: () => Promise<void>
  doesSessionExist: () => Promise<boolean>
  getAccessTokenPayloadSecurely: () => Promise<any>
  getUserId: () => Promise<string>
}

type AuthRecipe = {
  redirectToAuth: (input: 'signin' | 'signup') => void
}

type SuperTokensAuthImplementation = AuthImplementation<
  SuperTokensUser,
  never,
  void,
  void,
  void,
  never,
  never,
  never
>

const superTokensCreateAuthentication = (
  authImplementation: SuperTokensAuthImplementation,
  customProviderHooks?: {
    useCurrentUser?: () => Promise<Record<string, unknown>>
    useHasRole?: (
      currentUser: CurrentUser | null
    ) => (rolesToCheck: string | string[]) => boolean
  }
) => createAuthentication(authImplementation, customProviderHooks)

export function createSuperTokensAuth(
  superTokens: {
    authRecipe: AuthRecipe
    sessionRecipe: SessionRecipe
  },
  customProviderHooks?: {
    useCurrentUser?: () => Promise<Record<string, unknown>>
    useHasRole?: (
      currentUser: CurrentUser | null
    ) => (rolesToCheck: string | string[]) => boolean
  }
): ReturnType<typeof superTokensCreateAuthentication> {
  const authImplementation = createSuperTokensAuthImplementation(superTokens)

  return superTokensCreateAuthentication(
    authImplementation,
    customProviderHooks
  )
}

function createSuperTokensAuthImplementation(superTokens: {
  authRecipe: AuthRecipe
  sessionRecipe: SessionRecipe
}): SuperTokensAuthImplementation {
  return {
    type: 'supertokens',
    login: async () => superTokens.authRecipe.redirectToAuth('signin'),

    signup: async () => superTokens.authRecipe.redirectToAuth('signup'),

    logout: async () => superTokens.sessionRecipe.signOut(),

    getToken: async (): Promise<string | null> => {
      if (await superTokens.sessionRecipe.doesSessionExist()) {
        const accessTokenPayload =
          await superTokens.sessionRecipe.getAccessTokenPayloadSecurely()
        const jwtPropertyName = accessTokenPayload['_jwtPName']
        return accessTokenPayload[jwtPropertyName]
      } else {
        return null
      }
    },

    getUserMetadata: async (): Promise<SuperTokensUser | null> => {
      if (await superTokens.sessionRecipe.doesSessionExist()) {
        return {
          userId: await superTokens.sessionRecipe.getUserId(),
          accessTokenPayload:
            await superTokens.sessionRecipe.getAccessTokenPayloadSecurely(),
        }
      } else {
        return null
      }
    },
  }
}
