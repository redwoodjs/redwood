import { CurrentUser } from '../AuthContext'
import { createAuthentication } from '../authFactory'

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

function createSuperTokensAuthImplementation(superTokens: {
  authRecipe: AuthRecipe
  sessionRecipe: SessionRecipe
}) {
  return {
    type: 'supertokens',
    client: undefined,
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
