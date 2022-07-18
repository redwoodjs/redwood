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

  /** The user's data from the AuthProvider */
  getUserMetadata(): Promise<TUser | null>

  /** Hooks for managing the hosting auth provider's life-cycle */
  /** An optional hook to listen for updates from the 3rd party auth provider */
  useListenForUpdates?(handlers: ListenForUpdatesHandlers): void
}
