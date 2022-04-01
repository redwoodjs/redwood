import Clerk from '@clerk/clerk-js'
import {
  UserResource as ClerkUserResource,
  SignInProps,
  SignUpProps,
  SignOutCallback,
  GetTokenOptions,
  SignOutOptions,
  SignOut,
} from '@clerk/types'

import type { AuthClient } from '.'

export interface AuthClientClerk extends AuthClient {
  logout: SignOut
}

export type { Clerk }

export type ClerkUser = ClerkUserResource & { roles: string[] | null }

// In production, there is an issue where the AuthProvider sometimes captures
// Clerk as null. This intercepts that
// issue and falls back to `window.Clerk` to access the client.
function clerkClient(propsClient: Clerk | null) {
  if (!propsClient) {
    return window.Clerk ?? null
  } else {
    return propsClient
  }
}

export const clerk = (client: Clerk): AuthClientClerk => {
  return {
    type: 'clerk',
    client,
    login: async (options?: SignInProps) =>
      clerkClient(client)?.openSignIn(options || {}),
    logout: async (
      callbackOrOptions?: SignOutCallback | SignOutOptions,
      options?: SignOutOptions
    ) => clerkClient(client)?.signOut(callbackOrOptions as any, options),
    signup: async (options?: SignUpProps) =>
      clerkClient(client)?.openSignUp(options || {}),
    getToken: async (options?: GetTokenOptions) => {
      let token

      try {
        token = await clerkClient(client)?.session?.getToken(options)
      } catch {
        token = null
      }

      return token || null
    },
    getUserMetadata: async () => {
      return clerkClient(client)?.user
        ? {
            ...clerkClient(client)?.user,
            roles: clerkClient(client)?.user?.publicMetadata?.['roles'] ?? [],
          }
        : null
    },
  }
}
