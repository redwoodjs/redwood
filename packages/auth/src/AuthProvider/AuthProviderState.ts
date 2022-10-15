import { CurrentUser } from '../AuthContext'

export type AuthProviderState<TUser> = {
  loading: boolean
  isAuthenticated: boolean
  userMetadata: null | TUser
  currentUser: null | CurrentUser
  hasError: boolean
  error?: Error
}

export const defaultAuthProviderState: AuthProviderState<never> = {
  loading: true,
  isAuthenticated: false,
  userMetadata: null,
  currentUser: null,
  hasError: false,
}
