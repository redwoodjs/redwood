import React from 'react'

import type { AuthContextInterface } from './AuthContext'

export function createUseAuth<
  TUser,
  TLogIn,
  TLogOut,
  TSignUp,
  TForgotPassword,
  TResetPassword,
  TValidateResetToken
>(
  AuthContext: React.Context<
    | AuthContextInterface<
        TUser,
        TLogIn,
        TLogOut,
        TSignUp,
        TForgotPassword,
        TResetPassword,
        TValidateResetToken
      >
    | undefined
  >
) {
  const useAuth = (): AuthContextInterface<
    TUser,
    TLogIn,
    TLogOut,
    TSignUp,
    TForgotPassword,
    TResetPassword,
    TValidateResetToken
  > => {
    const context = React.useContext(AuthContext)

    if (!context) {
      throw new Error('useAuth must be used within an AuthProvider')
    }

    return context
  }

  // TODO: How/when is this used? Does this still work?
  global.__REDWOOD__USE_AUTH = useAuth

  return useAuth
}
