export interface ListenForUpdatesHandlers {
  reauthenticate: () => Promise<void>
}

export interface AuthImplementation<
  TUser,
  TRestoreAuth,
  TLogIn,
  TLogOut,
  TSignUp,
  TForgotPassword,
  TResetPassword,
  TValidateResetToken,
  TVerifyOtp
> {
  type: string

  restoreAuthState?(): Promise<TRestoreAuth>
  login(options?: unknown): Promise<TLogIn>
  logout(options?: unknown): Promise<TLogOut>
  signup(options?: unknown): Promise<TSignUp>
  getToken(options?: unknown): Promise<string | null>
  forgotPassword?(username: string): Promise<TForgotPassword>
  resetPassword?(options?: unknown): Promise<TResetPassword>
  validateResetToken?(token: string | null): Promise<TValidateResetToken>
  verifyOtp?(options?: unknown): Promise<TVerifyOtp>

  /**
   * The user's data from the AuthProvider
   *
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
  getUserMetadata(): Promise<TUser | null>

  /** Hooks for managing the hosting auth provider's life-cycle */
  /** An optional hook to listen for updates from the 3rd party auth provider */
  useListenForUpdates?(handlers: ListenForUpdatesHandlers): void
}
