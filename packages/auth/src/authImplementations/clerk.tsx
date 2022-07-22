import React, { useEffect } from 'react'

import {
  UserResource as ClerkUserResource,
  SignInProps,
  SignUpProps,
  SignOutCallback,
  Resources,
  Clerk,
  GetTokenOptions,
  SignOutOptions,
  UserResource,
} from '@clerk/types'

import { CurrentUser } from 'src/AuthContext'
import { createAuthentication } from 'src/authFactory'

import {
  AuthImplementation,
  ListenForUpdatesHandlers,
} from './AuthImplementation'

type ClerkUser = ClerkUserResource & { roles: string[] | null }

// Copy/pasted from @clerk/clerk-react because it wasn't exported
type UseUserReturn =
  | { isLoaded: false; isSignedIn: undefined; user: undefined }
  | { isLoaded: true; isSignedIn: false; user: null }
  | { isLoaded: true; isSignedIn: true; user: UserResource }

// Because Clerk's client is nulled out while it is loading, there is a race
// condition under normal usage on a clean load of the app. This falls back
// to the window.Clerk property when necessary to circumvent that.
function getClerkClient(propsClient: Clerk | null): Clerk | null {
  if (!propsClient && typeof window !== undefined) {
    return (window as any).Clerk ?? null
  } else {
    return propsClient
  }
}

type ClerkAuthImplementation = AuthImplementation<
  ClerkUser,
  void,
  void,
  void,
  void,
  never,
  never,
  never,
  never
>

const clerkCreateAuthentication = (
  authImplementation: ClerkAuthImplementation,
  customProviderHooks?: {
    useCurrentUser?: () => Promise<Record<string, unknown>>
    useHasRole?: (
      currentUser: CurrentUser | null
    ) => (rolesToCheck: string | string[]) => boolean
  }
) => createAuthentication(authImplementation, customProviderHooks)

interface AuthProviderProps {
  children: React.ReactNode
}

export function createClerkAuth(
  clerk: Clerk,
  useUser: () => UseUserReturn,
  ClerkAuthProvider: React.ComponentType,
  customProviderHooks?: {
    useCurrentUser?: () => Promise<Record<string, unknown>>
    useHasRole?: (
      currentUser: CurrentUser | null
    ) => (rolesToCheck: string | string[]) => boolean
  }
): ReturnType<typeof clerkCreateAuthentication> {
  const authImplementation = createClerkAuthImplementation(clerk, useUser)

  const {
    AuthContext,
    AuthProvider: InternalAuthProvider,
    useAuth,
  } = clerkCreateAuthentication(authImplementation, customProviderHooks)

  const AuthProvider = ({ children }: AuthProviderProps) => {
    return (
      <ClerkAuthProvider>
        <InternalAuthProvider type="clerk">{children}</InternalAuthProvider>
      </ClerkAuthProvider>
    )
  }

  return { AuthContext, AuthProvider, useAuth }
}

function createClerkAuthImplementation(
  clerk: Clerk,
  useClerkUser: () => UseUserReturn
): ClerkAuthImplementation {
  return {
    type: 'clerk',
    login: async (options?: SignInProps) =>
      getClerkClient(clerk)?.openSignIn(options || {}),
    logout: async (
      callbackOrOptions?: SignOutCallback | SignOutOptions,
      options?: SignOutOptions
    ) => getClerkClient(clerk)?.signOut(callbackOrOptions as any, options),
    signup: async (options?: SignUpProps) =>
      getClerkClient(clerk)?.openSignUp(options || {}),
    restoreAuthState: async () => {
      const clerkClient = getClerkClient(clerk)
      if (!clerkClient) {
        // If the client is null, we can't restore state or listen for it to
        // happen. This behavior is somewhat undefined, which is why we
        // instruct the user to wrap the auth provider in <ClerkLoaded> to
        // prevent it. For now we'll just return.

        if (process.env.NODE_ENV === 'development') {
          console.log('Please wrap your auth provider with `<ClerkLoaded>`')
        }

        return
      }

      // NOTE: Clerk's API docs says session will be undefined if loading (null
      // if loaded and confirmed unset).
      if (!clerkClient.client || clerkClient.session !== undefined) {
        return new Promise<void>((res) => {
          clerkClient.addListener((msg: Resources) => {
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
    useListenForUpdates: ({ reauthenticate }: ListenForUpdatesHandlers) => {
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
        token = await getClerkClient(clerk)?.session?.getToken(options)
      } catch {
        token = null
      }

      return token || null
    },
    getUserMetadata: async () => {
      const user = getClerkClient(clerk)?.user

      if (user) {
        const userRoles = user.publicMetadata?.roles
        let roles: string[] = []

        if (typeof userRoles === 'string') {
          roles = [userRoles]
        } else if (
          Array.isArray(userRoles) &&
          typeof userRoles[0] === 'string'
        ) {
          roles = userRoles
        }

        return { ...user, roles }
      }

      return null
    },
  }
}
