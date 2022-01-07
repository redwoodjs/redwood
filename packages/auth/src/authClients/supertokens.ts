import type { AuthClient } from './'

export interface SuperTokensUser {
  userId: string
  accessTokenPayload: any
}

export type SuperTokens = AuthClient

export const supertokens = (client: { authRecipe: any, sessionRecipe: any }): AuthClient => {
  return {
    type: 'supertokens',
    client: undefined,
    login: async () => client.authRecipe.redirectToAuth('signin'),

    signup: async () => client.authRecipe.redirectToAuth('signup'),

    logout: async () => client.sessionRecipe.signOut(),

    getToken: async (): Promise<string | null> => {
      if (await client.sessionRecipe.doesSessionExist()) {
        const accessTokenPayload =
          await client.sessionRecipe.getAccessTokenPayloadSecurely()
        const jwtPropertyName = accessTokenPayload['_jwtPName']
        return accessTokenPayload[jwtPropertyName]
      } else {
        return null
      }
    },

    getUserMetadata: async (): Promise<SuperTokensUser | null> => {
      if (await client.sessionRecipe.doesSessionExist()) {
        return {
          userId: await client.sessionRecipe.getUserId(),
          accessTokenPayload: await client.sessionRecipe.getAccessTokenPayloadSecurely(),
        }
      } else {
        return null
      }
    },
  }
}
