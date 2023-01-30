import SuperTokens from 'supertokens-auth-react'

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

export function createAuth(
  superTokens: SuperTokensAuth,
  customProviderHooks?: {
    useCurrentUser?: () => Promise<Record<string, unknown>>
    useHasRole?: (
      currentUser: CurrentUser | null
    ) => (rolesToCheck: string | string[]) => boolean
  }
) {
  const authImplementation = createAuthImplementation(superTokens)

  return createAuthentication(authImplementation, customProviderHooks)
}

export interface SuperTokensAuth {
  sessionRecipe: SessionRecipe
}

function createAuthImplementation(superTokens: SuperTokensAuth) {
  return {
    type: 'supertokens',
    login: () => {
      return SuperTokens.redirectToAuth({ show: 'signin', redirectBack: true })
    },
    signup: () => {
      return SuperTokens.redirectToAuth({ show: 'signup', redirectBack: true })
    },
    logout: () => {
      return superTokens.sessionRecipe.signOut()
    },
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
