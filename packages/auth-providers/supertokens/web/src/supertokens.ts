import { createAuthentication, CurrentUser } from '@redwoodjs/auth'

export interface SuperTokensUser {
  userId: string
  accessTokenPayload: any
}

export type SessionRecipe = {
  signOut: () => Promise<void>
  doesSessionExist: () => Promise<boolean>
  getAccessTokenPayloadSecurely: () => Promise<any>
  getUserId: () => Promise<string>
}

export type AuthRecipe = {
  redirectToAuth: (input: 'signin' | 'signup') => void
}

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
) {
  const authImplementation = createSuperTokensAuthImplementation(superTokens)

  return createAuthentication(authImplementation, customProviderHooks)
}

export interface SuperTokensAuth {
  authRecipe: AuthRecipe
  sessionRecipe: SessionRecipe
}

function createSuperTokensAuthImplementation(superTokens: SuperTokensAuth) {
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
