import { createAuthContext } from './AuthContext'
import { AuthImplementation } from './authImplementations/AuthImplementation'
import { createAuthProvider } from './AuthProvider/AuthProvider'
import { createUseAuth } from './useAuth'

export function createAuthentication<
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
) {
  const AuthContext = createAuthContext<
    TUser,
    TLogIn,
    TLogOut,
    TSignUp,
    TForgotPassword,
    TResetPassword,
    TValidateResetToken
  >()
  const useAuth = createUseAuth(AuthContext)
  const AuthProvider = createAuthProvider(AuthContext, authImplementation)

  // TODO: Do we really need to return AuthContext here?
  return { AuthContext, AuthProvider, useAuth }
}
