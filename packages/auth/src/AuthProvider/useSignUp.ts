import { useCallback } from 'react'

import { AuthImplementation } from 'src/authImplementations/AuthImplementation'

import { AuthProviderState } from './AuthProviderState'
import { useReauthenticate } from './useReauthenticate'

export const useSignUp = <
  TUser,
  TRestoreAuth,
  TLogIn,
  TLogOut,
  TSignUp,
  TForgotPassword,
  TResetPassword,
  TValidateResetToken,
  TVerifyOtp
>(
  authImplementation: AuthImplementation<
    TUser,
    TRestoreAuth,
    TLogIn,
    TLogOut,
    TSignUp,
    TForgotPassword,
    TResetPassword,
    TValidateResetToken,
    TVerifyOtp
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
      const signupOutput = await authImplementation.signup(options)
      await reauthenticate()
      return signupOutput
    },
    [authImplementation, reauthenticate]
  )
}
