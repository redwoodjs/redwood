import { useCallback } from 'react'

import type { AuthImplementation } from '../AuthImplementation'

import type { AuthProviderState } from './AuthProviderState'
import { defaultAuthProviderState } from './AuthProviderState'
import type { useCurrentUser } from './useCurrentUser'
import { useReauthenticate } from './useReauthenticate'

export const useLogIn = <
  TUser,
  TRestoreAuth,
  TLogInOptions,
  TLogIn,
  TLogOutOptions,
  TLogOut,
  TSignUpOptions,
  TSignUp,
  TForgotPassword,
  TResetPasswordOptions,
  TResetPassword,
  TValidateResetToken,
  TClient
>(
  authImplementation: AuthImplementation<
    TUser,
    TRestoreAuth,
    TLogInOptions,
    TLogIn,
    TLogOutOptions,
    TLogOut,
    TSignUpOptions,
    TSignUp,
    TForgotPassword,
    TResetPasswordOptions,
    TResetPassword,
    TValidateResetToken,
    TClient
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
    async (options?: TLogInOptions) => {
      setAuthProviderState(defaultAuthProviderState)
      const loginResult = await authImplementation.login(options)
      await reauthenticate()

      return loginResult
    },
    [authImplementation, reauthenticate, setAuthProviderState]
  )
}
