// TODO: Enable 👇
// import { CurrentUser, createAuthentication, AuthImplementation } from '@redwoodjs/auth'
import {
  CurrentUser,
  createAuthentication,
  AuthImplementation,
} from '../../index'

interface User {
  sub: string
  email?: string
  username?: string
}

// type CustomTestAuthImplementation = AuthImplementation<
//   User, // TUser
//   User | null, // TRestoreAuth
//   User | null, // TLogIn
//   boolean, // TLogOut
//   User | null, // TSignUp
//   never,
//   never,
//   never,
//   never
// >

export interface ValidateResetTokenResponse {
  error?: string
  [key: string]: string | undefined
}

type CustomTestAuthImplementation = AuthImplementation<
  User, // TUser
  never, // TRestoreAuth
  boolean, // TLogIn
  void, // TLogOut
  void, // TSignUp
  void, // TForgotPassword
  boolean, // TResetPassword
  ValidateResetTokenResponse, // TValidateResetToken
  never // TVerifyOtp
>

export interface CustomTestAuthClient {
  login: () => boolean
  logout: () => void
  signup: () => void
  getToken: () => string
  getUserMetadata: () => User | null
  forgotPassword: (username: string) => void
  resetPassword: (password: string) => boolean
  validateResetToken: (resetToken: string | null) => ValidateResetTokenResponse
}

const customTestCreateAuthentication = (
  authImplementation: CustomTestAuthImplementation,
  customProviderHooks?: {
    useCurrentUser?: () => Promise<Record<string, unknown>>
    useHasRole?: (
      currentUser: CurrentUser | null
    ) => (rolesToCheck: string | string[]) => boolean
  }
) => createAuthentication(authImplementation, customProviderHooks)

export function createCustomTestAuth(
  customTest: CustomTestAuthClient,
  customProviderHooks?: {
    useCurrentUser?: () => Promise<Record<string, unknown>>
    useHasRole?: (
      currentUser: CurrentUser | null
    ) => (rolesToCheck: string | string[]) => boolean
  }
): ReturnType<typeof customTestCreateAuthentication> {
  const authImplementation = createCustomTestAuthImplementation(customTest)

  return customTestCreateAuthentication(authImplementation, customProviderHooks)
}

function createCustomTestAuthImplementation(
  customTest: CustomTestAuthClient
): CustomTestAuthImplementation {
  return {
    type: 'custom-test',
    login: async () => customTest.login(),
    logout: async () => customTest.logout(),
    signup: async () => customTest.signup(),
    getToken: async () => customTest.getToken(),
    /**
     * Actual user metadata might look something like this
     * {
     *   "id": "11111111-2222-3333-4444-5555555555555",
     *   "aud": "authenticated",
     *   "role": "authenticated",
     *   "email": "email@example.com",
     *   "app_metadata": {
     *     "provider": "email"
     *   },
     *   "user_metadata": null,
     *   "created_at": "2016-05-15T19:53:12.368652374-07:00",
     *   "updated_at": "2016-05-15T19:53:12.368652374-07:00"
     * }
     */
    getUserMetadata: async () => customTest.getUserMetadata(),
    forgotPassword: async (username: string) =>
      customTest.forgotPassword(username),
    resetPassword: async (password: string) =>
      customTest.resetPassword(password),
    validateResetToken: async (resetToken: string | null) =>
      customTest.validateResetToken(resetToken),
  }
}
