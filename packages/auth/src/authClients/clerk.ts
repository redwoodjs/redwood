import { useEffect } from 'react'

import { useClerk, useUser as useClerkUser } from '@clerk/clerk-react'
import {
  UserResource as ClerkUserResource,
  SignInProps,
  SignUpProps,
  SignOutCallback,
  Resources,
  Clerk,
} from '@clerk/types'

import type { AuthClient } from '.'

export type AuthClientClerk = AuthClient

export type { Clerk }

export type ClerkUser = ClerkUserResource & { roles: string[] | null }

// In production, there is an issue where the AuthProvider sometimes captures
// Clerk as null. This intercepts that
// issue and falls back to `window.Clerk` to access the client.
function clerkClient(propsClient: Clerk | null): Clerk | null {
  if (!propsClient && typeof window !== undefined) {
    return (window as any).Clerk ?? null
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
    logout: async (options?: SignOutCallback) =>
      clerkClient(client)?.signOut(options),
    signup: async (options?: SignUpProps) =>
      clerkClient(client)?.openSignUp(options || {}),
    restoreAuthState: async () => {
      const clerk = clerkClient(client)
      if (!clerk) {
        // If the client is null, we can't restore state or listen for it to happen.
        // This behavior is somewhat undefined but it should be handled by `useIsWaitingForClient.
        // For now we'll just return.
        return
      }

      // NOTE(zack): Clerk's API docs say session will be undefined if loading (null if loaded and confirmed unset).
      if (!clerk.client || clerk.session !== undefined) {
        return new Promise<void>((res) => {
          clerk.addListener((msg: Resources) => {
            if (msg.session !== undefined && msg.client) {
              res()
            }
          })
        })
      } else {
        // In this case, we assume everything has been restored already.
        return
      }
    },
    // Hooks to inform AuthProvider of Clerk's life-cycle
    useIsWaitingForClient: () => {
      const clerk = useClerk()
      return !clerk?.client
    },
    useListenForUpdates: ({ reauthenticate }) => {
      const { isSignedIn, user, isLoaded } = useClerkUser()
      useEffect(() => {
        if (isLoaded) {
          reauthenticate()
        }
      }, [isSignedIn, user, reauthenticate, isLoaded])
    },
    // Clerk uses the session ID PLUS the __session cookie.
    getToken: async () => clerkClient(client)?.session?.id || null,
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
