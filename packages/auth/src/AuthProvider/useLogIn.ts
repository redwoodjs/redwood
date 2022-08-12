import { useCallback } from 'react'

import type { AuthImplementation } from '../AuthImplementation'

import {
  AuthProviderState,
  defaultAuthProviderState,
} from './AuthProviderState'
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
  skipFetchCurrentUser: boolean | undefined
) => {
  const reauthenticate = useReauthenticate(
    authImplementation,
    setAuthProviderState,
    skipFetchCurrentUser
  )

  return useCallback(
    async (options?: unknown) => {
      setAuthProviderState(defaultAuthProviderState)
      const loginOutput = await authImplementation.login(options)
      await reauthenticate()

      return loginOutput
    },
    [authImplementation, reauthenticate, setAuthProviderState]
  )
}
