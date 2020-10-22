import { AuthClient } from '../AuthProvider'

export function custom<T extends AuthClient>(authClient: T) {
  return authClient
}
