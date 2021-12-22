import Sessions from "supertokens-auth-react/recipe/session";

import type { AuthClient } from './';

export interface SuperTokensUser {
  userId: string;
  accessTokenPayload: any;
}

export type SuperTokens = AuthClient;

export const supertokens = (client: {
  authRecipe: any,
}): AuthClient => {
  return {
    type: "supertokens",
    client: undefined,
    login: async () => client.authRecipe.redirectToAuth('signin'),

    signup: async () => client.authRecipe.redirectToAuth('signup'),

    logout: async () => Sessions.signOut(),

    getToken: async (): Promise<string | null> => {
      if (await Sessions.doesSessionExist()) {
        let accessTokenPayload = await Sessions.getAccessTokenPayloadSecurely();
        let jwtPropertyName = accessTokenPayload["_jwtPName"];
        return accessTokenPayload[jwtPropertyName];
      } else {
        return null;
      }
    },

    getUserMetadata: async (): Promise<SuperTokensUser | null> => {
      if (await Sessions.doesSessionExist()) {
        return {
          userId: await Sessions.getUserId(),
          accessTokenPayload: await Sessions.getAccessTokenPayloadSecurely(),
        }
      } else {
        return null;
      }
    },
  };
}