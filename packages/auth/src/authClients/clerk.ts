import { Clerk } from '@clerk/clerk-js'
import { UserResource as ClerkUserResource } from '@clerk/types'

import type { AuthClient } from '.'

export type AuthClientClerk = AuthClient

export type { Clerk }

export type ClerkUser = ClerkUserResource & { roles: string[] | null }

// In production, there is an issue where the AuthProvider sometimes captures Clerk
// as null (and then sends it over as () => null). This captures that case and
// falls back to `window.Clerk` to access the client.
function clerkClient(propsClient: Clerk | (() => null)): Clerk | null {
  if (!propsClient || (typeof propsClient === 'function' && !propsClient())) {
    return window.Clerk ?? null
  } else {
    return propsClient
  }
}

export const clerk = (client: Clerk): AuthClientClerk => {
  return {
    type: 'clerk',
    client,
    login: async (options?) => clerkClient(client)?.openSignIn(options || {}),
    logout: async () => new Promise((res) => clerkClient(client)?.signOut(res)),
    signup: async (options?) => clerkClient(client)?.openSignUp(options || {}),
    // Clerk uses the session ID PLUS the __session cookie.
    getToken: async () => clerkClient(client)?.session.id,
    getUserMetadata: async () => {
      return clerkClient(client)?.user
        ? {
            ...clerkClient(client)?.user,
            roles: clerkClient(client)?.user.publicMetadata?.['roles'] ?? [],
          }
        : null
    },
  }
}
