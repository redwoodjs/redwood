import { useCallback } from 'react'

import type { AuthImplementation } from '../AuthImplementation'

import {
  AuthProviderState,
  defaultAuthProviderState,
} from './AuthProviderState'
import { useCurrentUser } from './useCurrentUser'
import { useReauthenticate } from './useReauthenticate'

export const useLogIn = <
  TUser,
  TRestoreAuth,
  TLogIn,
  TLogOut,
  TSignUp,
  TForgotPassword,
  TResetPassword,
  TValidateResetToken
>(
  authImplementation: AuthImplementation<
    TUser,
    TRestoreAuth,
    TLogIn,
    TLogOut,
    TSignUp,
    TForgotPassword,
    TResetPassword,
    TValidateResetToken
  >,
  setAuthProviderState: React.Dispatch<
    React.SetStateAction<AuthProviderState<TUser>>
  >,
  getCurrentUser: ReturnType<typeof useCurrentUser>,
  skipFetchCurrentUser: boolean | undefined
) => {
  const reauthenticate = useReauthenticate(
    authImplementation,
    setAuthProviderState,
    getCurrentUser,
    skipFetchCurrentUser
  )

  return useCallback(
    async (options?: unknown) => {
      setAuthProviderState(defaultAuthProviderState)
      const loginResult = await authImplementation.login(options)
      await reauthenticate()

      return loginResult
    },
    [authImplementation, reauthenticate, setAuthProviderState]
  )
}
