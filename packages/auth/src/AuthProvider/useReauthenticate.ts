import { useCallback } from 'react'

import type { AuthImplementation } from '../AuthImplementation'

import type { AuthProviderState } from './AuthProviderState'
import type { useCurrentUser } from './useCurrentUser'
import { useToken } from './useToken'

const notAuthenticatedState = {
  isAuthenticated: false,
  currentUser: null,
  userMetadata: null,
  loading: false,
  hasError: false,
} as const

export const useReauthenticate = <TUser>(
  authImplementation: AuthImplementation<TUser>,
  setAuthProviderState: React.Dispatch<
    React.SetStateAction<AuthProviderState<TUser>>
  >,
  getCurrentUser: ReturnType<typeof useCurrentUser>,
) => {
  const getToken = useToken(authImplementation)

  return useCallback(async () => {
    // Setting `loading` to `true` in the AuthProvider's state causes Set components to render their `whileLoadingAuthProp`,
    // so it has to be used a bit carefully. But having a stale auth state can be worse, mainly in Clerk's case.
    // It results in infinite redirects since Clerk thinks the user is authenticated, but the Router thinks otherwise.
    // So Redwood's Clerk integration sets `loadWhileReauthenticating` to true. We may migrate more auth providers over in the future,
    // but right now there's no known issues with them.
    if (authImplementation.loadWhileReauthenticating) {
      setAuthProviderState((oldState) => ({
        ...oldState,
        loading: true,
      }))
    }

    try {
      const userMetadata = await authImplementation.getUserMetadata()

      if (!userMetadata) {
        let loading = false

        if (authImplementation.clientHasLoaded) {
          loading = !authImplementation.clientHasLoaded()
        }

        setAuthProviderState({
          ...notAuthenticatedState,
          loading,
          client: authImplementation.client,
        })
      } else {
        // This call here is a local check against the auth provider's client.
        // e.g. if the auth sdk has logged you out, it'll throw an error
        await getToken()
        const currentUser = await getCurrentUser()

        setAuthProviderState((oldState) => ({
          ...oldState,
          userMetadata,
          currentUser,
          isAuthenticated: !!currentUser,
          loading: false,
          client: authImplementation.client,
        }))
      }
    } catch (e: any) {
      setAuthProviderState({
        ...notAuthenticatedState,
        hasError: true,
        error: e as Error,
      })
    }
  }, [authImplementation, setAuthProviderState, getToken, getCurrentUser])
}
