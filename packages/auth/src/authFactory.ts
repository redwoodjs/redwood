import { createAuthContext, CurrentUser } from './AuthContext'
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
  TClient
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
    TClient
  >,
  customProviderHooks?: {
    useCurrentUser?: () => Promise<Record<string, unknown>>
    useHasRole?: (
      currentUser: CurrentUser | null
    ) => (rolesToCheck: string | string[]) => boolean
  }
) {
  const AuthContext = createAuthContext<
    TUser,
    TLogIn,
    TLogOut,
    TSignUp,
    TForgotPassword,
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

  // TODO: Do we really need to return AuthContext here?
  return { AuthContext, AuthProvider, useAuth }
}
