import sessions from "supertokens-auth-react/recipe/session";

// TODO: remove use of emailpassword like this
import emailpassowrd from "supertokens-auth-react/recipe/emailpassword";

import { AuthClient } from './index';

export interface SuperTokensUser {
  userId: string,
  jwtPayload: any
}


export const supertokens = (): AuthClient => {
  return {
    type: 'supertokens',
    client: undefined,
    // TODO: use lib's login with redirect function (need to create one)
    login: async () => window.location.href = "/auth",

    logout: () => emailpassowrd.signOut(),

    // TODO: specifically go to sign up
    signup: async () => window.location.href = "/auth",

    getToken: async () => sessions.doesSessionExist() ? "" : null,

    getUserMetadata: async (): Promise<SuperTokensUser | null> => {
      if (sessions.doesSessionExist()) {
        return {
          userId: sessions.getUserId(),
          jwtPayload: await sessions.getJWTPayloadSecurely()
        }
      } else {
        return null;
      }
    },
  }
}
