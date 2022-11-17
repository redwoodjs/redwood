import { useCallback } from 'react'

import type { AuthImplementation } from '../AuthImplementation'

import { AuthProviderState } from './AuthProviderState'

export const useLogOut = <
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
  >
) => {
  return useCallback(
    async (options?: unknown) => {
      const logoutOutput = await authImplementation.logout(options)

      setAuthProviderState({
        userMetadata: null,
        currentUser: null,
        isAuthenticated: false,
        hasError: false,
        error: undefined,
        loading: false,
      })

      return logoutOutput
    },
    [authImplementation, setAuthProviderState]
  )
}
