import Sessions from "supertokens-auth-react/recipe/session";

import type { AuthClient } from './';

export interface SuperTokensUser {
  userId: string;
  accessTokenPayload: any;
}

export type SuperTokens = AuthClient;

export const supertokens = (client: {
  authRecipe: any,
  sessions: typeof Sessions,
  jwtPropertyName?: string,
}): AuthClient => {
  return {
    type: "supertokens",
    client: undefined,
    login: async () => client.authRecipe.redirectToAuth('signin'),

    signup: async () => client.authRecipe.redirectToAuth('signup'),

    logout: async () => client.sessions.signOut(),

    getToken: async (): Promise<string | null> => {
      if (await client.sessions.doesSessionExist()) {
        let jwtPropertyName = client.jwtPropertyName !== undefined && client.jwtPropertyName !== null ? client.jwtPropertyName : "jwt";

        let accessTokenPayload = await client.sessions.getAccessTokenPayloadSecurely();
        return accessTokenPayload[jwtPropertyName];
      } else {
        return null;
      }
    },

    getUserMetadata: async (): Promise<SuperTokensUser | null> => {
      if (await client.sessions.doesSessionExist()) {
        return {
          userId: await client.sessions.getUserId(),
          accessTokenPayload: await client.sessions.getAccessTokenPayloadSecurely(),
        }
      } else {
        return null;
      }
    },
    restoreAuthState: async () => {
      return client.sessions.attemptRefreshingSession();
    },
  };
}