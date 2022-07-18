import { useCallback } from 'react'

import { AuthImplementation } from 'src/authImplementations/AuthImplementation'

export const useValidateResetToken = <
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
  >
) => {
  return useCallback(
    async (resetToken: string | null) => {
      if (authImplementation.validateResetToken) {
        return await authImplementation.validateResetToken(resetToken)
      } else {
        throw new Error(
          `Auth client ${authImplementation.type} does not implement this function`
        )
      }
    },
    [authImplementation]
  )
}
