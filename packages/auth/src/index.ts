export { SupportedAuthTypes } from './authClients'

export interface CurrentUser {
  roles?: string[]
}

export { AuthProvider, AuthContextInterface } from './AuthProvider'
export { useAuth } from './useAuth'
