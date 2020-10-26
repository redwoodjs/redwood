import type { NetlifyIdentity } from './netlify'
import type { Auth0, Auth0User } from './auth0'
import type { GoTrue, GoTrueUser } from './goTrue'
import type { MagicLink, MagicUser } from './magicLink'
import type { Firebase } from './firebase'
import type { Supabase, SupabaseUser } from './supabase'
import { Facebook, FacebookUser } from './facebook'
import type { Custom } from './custom'
//
import { netlify } from './netlify'
import { auth0 } from './auth0'
import { goTrue } from './goTrue'
import { magicLink } from './magicLink'
import { firebase } from './firebase'
import { supabase } from './supabase'
import { facebook } from './facebook'
import { custom } from './custom'

const typesToClients = {
  netlify,
  auth0,
  goTrue,
  magicLink,
  firebase,
  supabase,
  facebook,
  /** Don't we support your auth client? No problem, define your own the `custom` type! */
  custom,
}

export type SupportedAuthClients =
  | Auth0
  | GoTrue
  | NetlifyIdentity
  | MagicLink
  | Firebase
  | Supabase
  | Facebook
  | Custom

export type SupportedAuthTypes = keyof typeof typesToClients

export type { Auth0User }
export type { GoTrueUser }
export type { MagicUser }
export type { SupabaseUser }
export type { FacebookUser }
export type SupportedUserMetadata =
  | Auth0User
  | GoTrueUser
  | MagicUser
  | SupabaseUser
  | FacebookUser

export interface AuthClient {
  restoreAuthState?(): void | Promise<any>
  login(options?: any): Promise<any>
  logout(options?: any): void | Promise<any>
  signup(options?: any): void | Promise<any>
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
  if (!typesToClients[type]) {
    throw new Error(
      `Your client ${type} is not supported, we only support ${Object.keys(
        typesToClients
      ).join(', ')}`
    )
  }
  return typesToClients[type](client)
}
