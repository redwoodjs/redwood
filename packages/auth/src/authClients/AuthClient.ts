import {
  SupportedAuthClients,
  SupportedAuthConfig,
  SupportedAuthTypes,
  SupportedUserMetadata,
  typesToClients,
} from './SupportedAuthClients'

export interface AuthClient {
  restoreAuthState?(): void | Promise<any>
  login(options?: any): Promise<any>
  logout(options?: any): void | Promise<any>
  signup(options?: any): void | Promise<any>
  getToken(options?: any): Promise<null | string>
  forgotPassword?(username: string): void | Promise<any>
  resetPassword?(options?: any): void | Promise<any>
  validateResetToken?(token: string | null): void | Promise<any>

  /** The user's data from the AuthProvider */
  getUserMetadata(): Promise<null | SupportedUserMetadata>

  client: SupportedAuthClients
  type: SupportedAuthTypes
}

export const createAuthClient = (
  client: SupportedAuthClients,
  type: SupportedAuthTypes,
  config?: SupportedAuthConfig
): AuthClient => {
  if (!typesToClients[type]) {
    throw new Error(
      `Your client ${type} is not supported, we only support ${Object.keys(
        typesToClients
      ).join(', ')}`
    )
  }

  return typesToClients[type](client, config)
}
