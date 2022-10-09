export interface AuthImplementation<
  TUser = unknown,
  TRestoreAuth = unknown,
  TLogIn = unknown,
  TLogOut = unknown,
  TSignUp = unknown,
  TForgotPassword = unknown,
  TResetPassword = unknown,
  TValidateResetToken = unknown,
  TClient = unknown
> {
  type: string
  client?: TClient

  restoreAuthState?(): Promise<TRestoreAuth>
  login(options?: unknown): Promise<TLogIn>
  logout(options?: unknown): Promise<TLogOut>
  signup(options?: unknown): Promise<TSignUp>
  getToken(options?: unknown): Promise<string | null>
  forgotPassword?(username: string): Promise<TForgotPassword>
  resetPassword?(options?: unknown): Promise<TResetPassword>
  validateResetToken?(token: string | null): Promise<TValidateResetToken>

  /**
   * The user's data from the AuthProvider
   *
   * Exactly what this looks like will depend on the auth service provider,
   * but one example is this
   * ```json
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
   * ```
   */
  getUserMetadata(): Promise<TUser | null>
}
