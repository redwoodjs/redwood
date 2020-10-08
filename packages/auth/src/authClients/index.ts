/**
 * ! typing and design-wise this module could use some attention.
 * Proposal:
 * @link https://community.redwoodjs.com/t/proposal-dont-magically-wrap-auth-providers/1264
 */
import type { Auth0, Auth0User } from './auth0'
import { auth0 } from './auth0'
import type { Custom } from './custom'
import { custom } from './custom'
import type { Firebase } from './firebase'
import { firebase } from './firebase'
import type { GoTrue, GoTrueUser } from './goTrue'
import { goTrue } from './goTrue'
import type { MagicLink, MagicUser } from './magicLink'
import { magicLink } from './magicLink'
import type { NetlifyIdentity } from './netlify'
import { netlify } from './netlify'
import type { Supabase, SupabaseUser } from './supabase'
import { supabase } from './supabase'

const typesToClients = {
  netlify,
  auth0,
  goTrue,
  magicLink,
  firebase,
  supabase,
  custom,
  /** Don't we support your auth client? No problem, define your own the `custom` type! */
} as const

export type CreatedClients = typeof typesToClients

export type SupportedAuthClientsMap = {
  netlify: NetlifyIdentity
  auth0: Auth0
  goTrue: GoTrue
  magicLink: MagicLink
  firebase: Firebase
  supabase: Supabase
  custom: Custom
}

export type SupportedAuthTypes = keyof SupportedAuthClientsMap

export type SupportedAuthClients = SupportedAuthClientsMap[SupportedAuthTypes]

export type { Auth0User }
export type { GoTrueUser }
export type { MagicUser }
export type { SupabaseUser }
export type SupportedUserMetadata =
  | Auth0User
  | GoTrueUser
  | MagicUser
  | SupabaseUser

export interface AuthClient {
  restoreAuthState?(): void | Promise<any>
  login(options?: any): Promise<any>
  logout(options?: any): void | Promise<void>
  signup(options?: any): void | Promise<any>
  getToken(): Promise<null | string>
  /** The user's data from the AuthProvider */
  getUserMetadata(): Promise<null | SupportedUserMetadata>
  client: SupportedAuthClients
  type: SupportedAuthTypes
}

export function createAuthClient<Client extends AuthClient>(
  client: Client,
  type: 'custom'
): Client
export function createAuthClient<T extends SupportedAuthTypes>(
  client: SupportedAuthClientsMap[T],
  type: T
): ReturnType<typeof typesToClients[T]>
export function createAuthClient(
  client: SupportedAuthClients,
  type: SupportedAuthTypes
): AuthClient {
  if (!typesToClients[type]) {
    throw new Error(
      `Your client ${type} is not supported, we only support ${Object.keys(
        typesToClients
      ).join(', ')}`
    )
  }
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
  return typesToClients[type](client)
}
