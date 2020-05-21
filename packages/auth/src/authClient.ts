import type { default as GoTrue, User as GoTrueUser } from 'gotrue-js'
import type { Auth0Client as Auth0 } from '@auth0/auth0-spa-js'
import type NetlifyIdentityNS from 'netlify-identity-widget'

// TODO: Can also return an Auth0 user which doesn't have a definition.
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface Auth0User {}
export type { GoTrueUser }
export type NetlifyIdentity = typeof NetlifyIdentityNS
export type MagicLinks = { user: any; auth: any }

export type SupportedAuthClients = Auth0 | GoTrue | NetlifyIdentity | MagicLinks
export type SupportedAuthTypes = 'auth0' | 'gotrue' | 'netlify' | 'magic.link'

export interface AuthClient {
  restoreAuthState?(): void | Promise<any>
  login(options?: any): Promise<any>
  logout(): void | Promise<void>
  getToken(): Promise<null | string>
  currentUser(): Promise<null | Auth0User | GoTrueUser>
  client: SupportedAuthClients
  type: SupportedAuthTypes
}

export type AuthClientAuth0 = AuthClient

export interface AuthClientGoTrue extends AuthClient {
  login(options: {
    email: string
    password: string
    remember?: boolean
  }): Promise<GoTrueUser>
  client: GoTrue
}

const mapAuthClientAuth0 = (client: Auth0): AuthClientAuth0 => {
  return {
    type: 'auth0',
    client,
    restoreAuthState: async () => {
      if (window.location.search.includes('code=')) {
        const { appState } = await client.handleRedirectCallback()
        window.history.replaceState(
          {},
          document.title,
          appState && appState.targetUrl
            ? appState.targetUrl
            : window.location.pathname
        )
      }
    },
    login: async () => client.loginWithRedirect(),
    logout: () => client.logout(),
    getToken: async () => client.getTokenSilently(),
    currentUser: async () => {
      const user = await client.getUser()
      return user || null
    },
  }
}

const mapAuthClientGoTrue = (client: GoTrue): AuthClientGoTrue => {
  return {
    type: 'gotrue',
    client,
    login: async ({ email, password, remember }) =>
      client.login(email, password, remember),
    logout: async () => {
      const user = await client.currentUser()
      return user?.logout()
    },
    getToken: async () => {
      const user = await client.currentUser()
      return user?.jwt() || null
    },
    currentUser: async () => client.currentUser(),
  }
}

const mapAuthClientNetlify = (client: NetlifyIdentity): AuthClient => {
  return {
    type: 'netlify',
    client,
    login: () => {
      return new Promise((resolve, reject) => {
        let autoClosedModal = false
        client.open('login')
        client.on('login', (user) => {
          // This closes the modal which pops-up immediately after you login.
          autoClosedModal = true
          client.close()
          return resolve(user)
        })
        client.on('close', () => {
          !autoClosedModal && resolve(null)
        })
        client.on('error', reject)
      })
    },
    logout: () => {
      return new Promise((resolve, reject) => {
        client.logout()
        client.on('logout', resolve)
        client.on('error', reject)
      })
    },

    getToken: async () => {
      const user = await client.currentUser()
      return user?.token?.access_token || null
    },
    currentUser: async () => {
      return client.currentUser()
    },
  }
}

const mapAuthClientMagicLinks = (client: MagicLinks): AuthClient => {
  return {
    type: 'magic.link',
    client,
    login: async ({ email }) =>
      await client.auth.loginWithMagicLink({ email: email }),
    logout: () => client.user.logout(),
    getToken: async () => await client.user.getIdToken(),
    currentUser: async () =>
      (await client.user.isLoggedIn()) ? await client.user.getMetadata() : null,
  }
}

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
      return mapAuthClientMagicLinks(client as MagicLinks)
    default:
      throw new Error(
        `The ${type} auth client is not currently supported, please consider adding it.`
      )
  }
}
