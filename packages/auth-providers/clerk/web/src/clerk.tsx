import {
  SignInProps,
  SignUpProps,
  SignOutCallback,
  Clerk as ClerkClient,
  GetTokenOptions,
  SignOutOptions,
} from '@clerk/types'

import { CurrentUser, createAuthentication } from '@redwoodjs/auth'

type Clerk = ClerkClient | undefined | null

export function createAuth(customProviderHooks?: {
  useCurrentUser?: () => Promise<Record<string, unknown>>
  useHasRole?: (
    currentUser: CurrentUser | null
  ) => (rolesToCheck: string | string[]) => boolean
}) {
  const authImplementation = createAuthImplementation()

  return createAuthentication(authImplementation, customProviderHooks)
}

function createAuthImplementation() {
  return {
    type: 'clerk',
    get client(): Clerk | undefined {
      return (window as any).Clerk
    },
    login: async (options?: SignInProps) => {
      const clerk = (window as any).Clerk as Clerk
      clerk?.openSignIn(options || {})
    },
    logout: async (
      callbackOrOptions?: SignOutCallback | SignOutOptions,
      options?: SignOutOptions
    ) => {
      const clerk = (window as any).Clerk as Clerk
      return clerk?.signOut(callbackOrOptions as any, options)
    },
    signup: async (options?: SignUpProps) => {
      const clerk = (window as any).Clerk as Clerk
      clerk?.openSignUp(options || {})
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
      return clerk?.user
    },
  }
}
