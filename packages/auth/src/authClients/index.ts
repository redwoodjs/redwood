import type { NetlifyIdentity } from './netlify'
import type { Auth0, Auth0User } from './auth0'
import type { GoTrue, GoTrueUser } from './gotrue'
import type { MagicLink, MagicUser } from './magicLink'
import type { FirebaseClient } from './firebase'
import { mapAuthClientNetlify } from './netlify'
import { mapAuthClientAuth0 } from './auth0'
import { mapAuthClientGoTrue } from './gotrue'
import { mapAuthClientMagicLink } from './magicLink'
import { mapAuthClientFirebase } from './firebase'

export type SupportedAuthClients =
  | Auth0
  | GoTrue
  | NetlifyIdentity
  | MagicLink
  | FirebaseClient

export type SupportedAuthTypes =
  | 'auth0'
  | 'gotrue'
  | 'netlify'
  | 'magic.link'
  | 'firebase'

export type { Auth0User }
export type { GoTrueUser }
export type { MagicUser }
export type SupportedAuthUsers = Auth0User | GoTrueUser | MagicUser

export interface AuthClient {
  restoreAuthState?(): void | Promise<any>
  login(options?: any): Promise<any>
  logout(): void | Promise<void>
  getToken(): Promise<null | string>
  currentUser(): Promise<null | SupportedAuthUsers>
  client: SupportedAuthClients
  type: SupportedAuthTypes
}

export const createAuthClient = (
  client: SupportedAuthClients,
  type: SupportedAuthTypes
): AuthClient => {
  const clients: Record<SupportedAuthClients, () => SupportedAuthClients> = {
    auth0: () => mapAuthClientAuth0(client),
    gotrue: () => mapAuthClientGoTrue(client),
    netlify: () => mapAuthClientNetlify(client),
    'magic.link': () => mapAuthClientMagicLink(client),
    firebase: () => mapAuthClientFirebase(client),
  }
  return clients[type]()
}
