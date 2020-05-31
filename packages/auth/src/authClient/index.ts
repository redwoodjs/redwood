import type { NetlifyIdentity } from './netlify'
import type { Auth0, Auth0User } from './auth0'
import type { GoTrue, GoTrueUser } from './gotrue'
import type { MagicLink, MagicUser } from './magicLink'
import type { FirebaseClient } from './firebase'
//
import { mapAuthClientNetlify } from './netlify'
import { mapAuthClientAuth0 } from './auth0'
import { mapAuthClientGoTrue } from './gotrue'
import { mapAuthClientMagicLink } from './magicLink'
import { mapAuthClientFirebase } from './firebase'

// TODO: Make this an enum
export type SupportedAuthClients =
  | Auth0
  | GoTrue
  | NetlifyIdentity
  | MagicLink
  | FirebaseClient

// TODO: Make these enums
export type SupportedAuthTypes =
  | 'auth0'
  | 'gotrue'
  | 'netlify'
  | 'magic.link'
  | 'firebase'

export interface AuthClient {
  restoreAuthState?(): void | Promise<any>
  login(options?: any): Promise<any>
  logout(): void | Promise<void>
  getToken(): Promise<null | string>
  currentUser(): Promise<null | Auth0User | GoTrueUser | MagicUser>
  client: SupportedAuthClients
  type: SupportedAuthTypes
}

// TODO: Make this an object,
export const createAuthClient = (
  client: SupportedAuthClients,
  type: SupportedAuthTypes
): AuthClient => {
  switch (type) {
    case 'auth0':
      return mapAuthClientAuth0(client as Auth0)
    case 'gotrue':
      return mapAuthClientGoTrue(client as GoTrue)
    case 'netlify':
      return mapAuthClientNetlify(client as NetlifyIdentity)
    case 'magic.link':
      return mapAuthClientMagicLink(client as MagicLink)
    case 'firebase':
      return mapAuthClientFirebase(client as FirebaseClient)
    default:
      throw new Error(
        `The ${type} auth client is not currently supported, please consider adding it.`
      )
  }
}
