import { auth0 } from './auth0'
import type { Auth0, Auth0User } from './auth0'
import { AuthClient } from './AuthClient'
import { azureActiveDirectory } from './azureActiveDirectory'
import type {
  AzureActiveDirectory,
  AzureActiveDirectoryUser,
} from './azureActiveDirectory'
import { clerk } from './clerk'
import type { Clerk, ClerkUser } from './clerk'
import { custom } from './custom'
import type { Custom } from './custom'
import { dbAuth } from './dbAuth'
import type { DbAuth, DbAuthConfig } from './dbAuth'
import { ethereum } from './ethereum'
import type { Ethereum, EthereumUser } from './ethereum'
import { firebase } from './firebase'
import type { FirebaseClient, FirebaseUser } from './firebase'
import { goTrue } from './goTrue'
import type { GoTrue, GoTrueUser } from './goTrue'
import { magicLink } from './magicLink'
import type { MagicLink, MagicUser } from './magicLink'
import { netlify } from './netlify'
import type { NetlifyIdentity } from './netlify'
import { nhost } from './nhost'
import type { Nhost, NhostUser } from './nhost'
import { supabase } from './supabase'
import type { Supabase, SupabaseUser } from './supabase'
import { supertokens } from './supertokens'
import type { SuperTokensUser, SuperTokens } from './supertokens'

export type AuthFactory<
  ClientType,
  ConfigType,
  AuthClientType extends AuthClient
> = (
  client: ClientType,
  config: ConfigType
) => AuthClientType | Promise<AuthClientType>

export const typesToClients: Record<string, AuthFactory<any, any, any>> = {
  netlify,
  auth0,
  azureActiveDirectory,
  dbAuth,
  goTrue,
  magicLink,
  firebase,
  supabase,
  ethereum,
  nhost,
  clerk,
  supertokens,
  /** Don't we support your auth client? No problem, define your own the `custom` type! */
  custom,
}

export type SupportedAuthClients =
  | Auth0
  | AzureActiveDirectory
  | DbAuth
  | GoTrue
  | NetlifyIdentity
  | MagicLink
  | FirebaseClient
  | Supabase
  | Clerk
  | Ethereum
  | Nhost
  | SuperTokens
  | Custom

export type SupportedAuthTypes = keyof typeof typesToClients

export type SupportedAuthConfig = DbAuthConfig

export type { Auth0User }
export type { AzureActiveDirectoryUser }
export type { DbAuth }
export type { ClerkUser }
export type { FirebaseUser }
export type { GoTrueUser }
export type { MagicUser }
export type { SupabaseUser }
export type { EthereumUser }
export type { NhostUser }
export type { SuperTokensUser }
export type SupportedUserMetadata =
  | Auth0User
  | AzureActiveDirectoryUser
  | ClerkUser
  | FirebaseUser
  | GoTrueUser
  | MagicUser
  | SupabaseUser
  | EthereumUser
  | NhostUser
  | SuperTokensUser
