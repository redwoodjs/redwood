import { useCallback } from 'react'

import type { AuthImplementation } from '../AuthImplementation'

export const useForgotPassword = <
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
  >
) => {
  return useCallback(
    async (username: string) => {
      if (authImplementation.forgotPassword) {
        return await authImplementation.forgotPassword(username)
      } else {
        throw new Error(
          `Auth client ${authImplementation.type} does not implement this function`
        )
      }
    },
    [authImplementation]
  )
}
