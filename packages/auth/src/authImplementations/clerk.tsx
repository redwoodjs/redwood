import {
  SignInProps,
  SignUpProps,
  SignOutCallback,
  Resources,
  Clerk,
  GetTokenOptions,
  SignOutOptions,
} from '@clerk/types'

import { CurrentUser } from '../AuthContext'
import { createAuthentication } from '../authFactory'

export function createClerkAuth(customProviderHooks?: {
  useCurrentUser?: () => Promise<Record<string, unknown>>
  useHasRole?: (
    currentUser: CurrentUser | null
  ) => (rolesToCheck: string | string[]) => boolean
}) {
  const authImplementation = createClerkAuthImplementation()

  const { AuthContext, AuthProvider, useAuth } = createAuthentication(
    authImplementation,
    customProviderHooks
  )

  return { AuthContext, AuthProvider, useAuth }
}

function createClerkAuthImplementation() {
  return {
    type: 'clerk',
    login: async (options?: SignInProps) => {
      const clerk = (window as any).Clerk as Clerk
      clerk?.openSignIn(options || {})
    },
    logout: async (
      callbackOrOptions?: SignOutCallback | SignOutOptions,
      options?: SignOutOptions
    ) => {
      const clerk = (window as any).Clerk as Clerk
      clerk?.signOut(callbackOrOptions as any, options)
    },
    signup: async (options?: SignUpProps) => {
      const clerk = (window as any).Clerk as Clerk
      clerk?.openSignUp(options || {})
    },
    restoreAuthState: async () => {
      const clerk = (window as any).Clerk as Clerk
      if (!clerk) {
        // If clerk is null, we can't restore state or listen for it to
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
      if (!clerk || clerk.session !== undefined) {
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
    getToken: async (options?: GetTokenOptions) => {
      const clerk = (window as any).Clerk as Clerk

      let token

      try {
        token = await clerk?.session?.getToken(options)
      } catch {
        token = null
      }

      return token || null
    },
    getUserMetadata: async () => {
      const clerk = (window as any).Clerk as Clerk
      const user = clerk?.user

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
