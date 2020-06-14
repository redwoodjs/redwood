import type { NetlifyIdentity } from './netlify'
import type { Auth0, Auth0User } from './auth0'
import type { GoTrue, GoTrueUser } from './gotrue'
import type { MagicLink, MagicUser } from './magicLink'
import type { FirebaseClient } from './firebase'
//
import { netlify } from './netlify'
import { auth0 } from './auth0'
import { goTrue } from './gotrue'
import { magicLink } from './magicLink'
import { firebase } from './firebase'

const typesToClients = {
  netlify,
  auth0,
  goTrue,
  magicLink,
  firebase,
  /** We don't support your auth client? No problem, define your own using `custom`! */
  custom: (c) => c,
}

export type SupportedAuthClients =
  | Auth0
  | GoTrue
  | NetlifyIdentity
  | MagicLink
  | FirebaseClient

export type SupportedAuthTypes = keyof typeof typesToClients

export type { Auth0User }
export type { GoTrueUser }
export type { MagicUser }
export type SupportedUserMetadata = Auth0User | GoTrueUser | MagicUser

export interface AuthClient {
  restoreAuthState?(): void | Promise<any>
  login(options?: any): Promise<any>
  logout(): void | Promise<void>
  getToken(): Promise<null | string>
  /** The user's data from the AuthProvider */
  getUserMetadata(): Promise<null | SupportedUserMetadata>
  client: SupportedAuthClients
  type: SupportedAuthTypes
}

export const createAuthClient = (
  client: SupportedAuthClients,
  type: SupportedAuthTypes
): AuthClient => {
  return typesToClients[type](client)
}
