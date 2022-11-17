import { useCallback } from 'react'

import type { AuthImplementation } from '../AuthImplementation'

export const useResetPassword = <
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
    async (options?: unknown) => {
      if (authImplementation.resetPassword) {
        return await authImplementation.resetPassword(options)
      } else {
        throw new Error(
          `Auth client ${authImplementation.type} does not implement this function`
        )
      }
    },
    [authImplementation]
  )
}
