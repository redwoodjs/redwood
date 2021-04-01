import Sessions from "supertokens-auth-react/recipe/session";

import AuthRecipe from "supertokens-auth-react/lib/build/recipe/authRecipeModule";

import { AuthClient } from './index';

export interface SuperTokensUser {
  userId: string,
  jwtPayload: any
}


export const supertokens = <T, S, R, N>(client: {
  authRecipe: AuthRecipe<T, S, R, N>,
  sessions: typeof Sessions
}): AuthClient => {
  return {
    type: 'supertokens',
    client: undefined,
    // TODO: use lib's login with redirect function (need to create one)
    login: async () => client.authRecipe.redirectToAuth("signin"),

    logout: () => client.authRecipe.signOut(),

    // TODO: specifically go to sign up
    signup: async () => client.authRecipe.redirectToAuth("signup"),

    getToken: async () => null,

    getUserMetadata: async (): Promise<SuperTokensUser | null> => {
      if (client.sessions.doesSessionExist()) {
        return {
          userId: client.sessions.getUserId(),
          jwtPayload: await client.sessions.getJWTPayloadSecurely()
        }
      } else {
        return null;
      }
    },
  }
}
