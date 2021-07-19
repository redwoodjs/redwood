import { Clerk } from '@clerk/clerk-js'

import type { AuthClient } from '.'

export type AuthClientClerk = AuthClient

export type { Clerk }

// TODO: Map out this user properly.
export interface ClerkUser {}

export const clerk = (client: Clerk): AuthClientClerk => {
  return {
    type: 'clerk',
    client,
    login: async (options?) => client.openSignIn(options || {}),
    logout: async () => new Promise((res) => client.signOut(res)),
    signup: async (options?) => client.openSignUp(options || {}),
    // Clerk uses the session ID PLUS the __session cookie.
    getToken: async () => client.session.id,
    getUserMetadata: async () => {
      return client.user
        ? { ...client.user, roles: client.user.publicMetadata['roles'] }
        : null
    },
  }
}
