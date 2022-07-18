import { useCallback } from 'react'

import { AuthImplementation } from 'src/authImplementations/AuthImplementation'

import { AuthProviderState } from './AuthProviderState'
import { useCurrentUser } from './useCurrentUser'
import { useToken } from './useToken'

export const useReauthenticate = <TUser>(
  authImplementation: AuthImplementation<
    TUser,
    unknown,
    unknown,
    unknown,
    unknown,
    unknown,
    unknown,
    unknown,
    unknown
  >,
  setAuthProviderState: React.Dispatch<
    React.SetStateAction<AuthProviderState<TUser>>
  >,
  skipFetchCurrentUser: boolean | undefined
) => {
  const getCurrentUser = useCurrentUser(authImplementation)
  const getToken = useToken(authImplementation)

  return useCallback(async () => {
    const notAuthenticatedState: AuthProviderState<TUser> = {
      isAuthenticated: false,
      currentUser: null,
      userMetadata: null,
      loading: false,
      hasError: false,
    }

    try {
      const userMetadata = await authImplementation.getUserMetadata()
      if (!userMetadata) {
        setAuthProviderState(notAuthenticatedState)
      } else {
        await getToken()

        const currentUser = skipFetchCurrentUser ? null : await getCurrentUser()

        setAuthProviderState((oldState) => ({
          ...oldState,
          userMetadata,
          currentUser,
          isAuthenticated: true,
          loading: false,
        }))
      }
    } catch (e: any) {
      setAuthProviderState({
        ...notAuthenticatedState,
        hasError: true,
        error: e as Error,
      })
    }
  }, [
    authImplementation,
    getToken,
    setAuthProviderState,
    skipFetchCurrentUser,
    getCurrentUser,
  ])
}
