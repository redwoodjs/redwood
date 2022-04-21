import { useEffect } from 'react'

import {
  UserResource as ClerkUserResource,
  SignInProps,
  SignUpProps,
  SignOutCallback,
  Resources,
  Clerk,
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

// Because Clerk's client is nulled out while it is loading, there is a race
// condition under normal usage on a clean load of the app. This falls back
// to the window.Clerk property when necessary to circumvent that.
function clerkClient(propsClient: Clerk | null): Clerk | null {
  if (!propsClient && typeof window !== undefined) {
    return (window as any).Clerk ?? null
  } else {
    return propsClient
  }
}

export const clerk = async (client: Clerk): Promise<AuthClientClerk> => {
  // We use the typescript dynamic import feature to pull in the react library only if clerk is needed.
  const { useUser: useClerkUser } = await import('@clerk/clerk-react')

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
    restoreAuthState: async () => {
      const clerk = clerkClient(client)
      if (!clerk) {
        // If the client is null, we can't restore state or listen for it to happen.
        // This behavior is somewhat undefined, which is why we instruct the user to wrap
        // the auth provider in <ClerkLoaded> to prevent it. For now we'll just return.
        return
      }

      // NOTE: Clerk's API docs say session will be undefined if loading (null if loaded and confirmed unset).
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
    // Hook to inform AuthProvider of Clerk's life-cycle
    useListenForUpdates: ({ reauthenticate }) => {
      const { isSignedIn, user, isLoaded } = useClerkUser()
      useEffect(() => {
        if (isLoaded) {
          reauthenticate()
        }
      }, [isSignedIn, user, reauthenticate, isLoaded])
    },
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
