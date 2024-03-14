import type { CurrentUser } from './AuthContext'
import { createAuthContext } from './AuthContext'
import type { AuthImplementation } from './AuthImplementation'
import { createAuthProvider } from './AuthProvider/AuthProvider'
import { createUseAuth } from './useAuth'

export function createAuthentication<
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
  customProviderHooks?: {
    useCurrentUser?: () => Promise<CurrentUser>
    useHasRole?: (
      currentUser: CurrentUser | null
    ) => (rolesToCheck: string | string[]) => boolean
  }
) {
  const AuthContext = createAuthContext<
    TUser,
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
  >()
  const useAuth = createUseAuth(AuthContext)
  const AuthProvider = createAuthProvider(
    AuthContext,
    authImplementation,
    customProviderHooks
  )

  return { AuthContext, AuthProvider, useAuth }
}
