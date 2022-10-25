import * as NetlifyIdentityNS from 'netlify-identity-widget'

import { CurrentUser, createAuthentication } from '@redwoodjs/auth'

// TODO:
// In the future, when this is a separate package, we can import the full thing
// here (not just the type), and save the user from doing that in their own
// code
// import netlifyIdentity from 'netlify-identity-widget'

type NetlifyIdentity = typeof NetlifyIdentityNS

export function createNetlifyAuth(
  netlifyIdentity: NetlifyIdentity,
  customProviderHooks?: {
    useCurrentUser?: () => Promise<Record<string, unknown>>
    useHasRole?: (
      currentUser: CurrentUser | null
    ) => (rolesToCheck: string | string[]) => boolean
  }
) {
  const authImplementation = createNetlifyAuthImplementation(netlifyIdentity)

  // TODO: Add this when this is a separate package. For now it'll have to be
  // done in the user's app
  // isBrowser && netlifyIdentity.init()

  return createAuthentication(authImplementation, customProviderHooks)
}

function createNetlifyAuthImplementation(netlifyIdentity: NetlifyIdentity) {
  return {
    type: 'netlify',
    client: netlifyIdentity,
    login: () => {
      return new Promise<NetlifyIdentityNS.User | null>((resolve, reject) => {
        let autoClosedModal = false
        netlifyIdentity.open('login')
        netlifyIdentity.on('login', (user) => {
          // This closes the modal which pops-up immediately after you login.
          autoClosedModal = true
          netlifyIdentity.close()
          return resolve(user)
        })
        netlifyIdentity.on('close', () => {
          !autoClosedModal && resolve(null)
        })
        netlifyIdentity.on('error', reject)
      })
    },
    logout: () => {
      return new Promise<void>((resolve, reject) => {
        netlifyIdentity.logout()
        netlifyIdentity.on('logout', resolve)
        netlifyIdentity.on('error', reject)
      })
    },
    signup: () => {
      return new Promise<null>((resolve, reject) => {
        netlifyIdentity.open('signup')
        netlifyIdentity.on('close', () => {
          resolve(null)
        })
        netlifyIdentity.on('error', reject)
      })
    },
    getToken: async () => {
      try {
        // The client refresh function only actually refreshes token
        // when it's been expired. Don't panic
        await netlifyIdentity.refresh()
        const user = await netlifyIdentity.currentUser()
        return user?.token?.access_token || null
      } catch {
        return null
      }
    },
    getUserMetadata: async () => {
      return netlifyIdentity.currentUser()
    },
    restoreAuthState: async () => {
      return netlifyIdentity.currentUser()
    },
  }
}
