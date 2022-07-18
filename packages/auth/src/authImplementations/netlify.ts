import type * as NetlifyIdentityNS from 'netlify-identity-widget'

import { isBrowser } from '@redwoodjs/prerender/browserUtils'

import { createAuthentication } from 'src/authFactory'
// TODO:
// In the future, when this is a separate package, we can import the full thing
// here (not just the type), and save the user from doing that in their own
// code
// import netlifyIdentity from 'netlify-identity-widget'

import { AuthImplementation } from './AuthImplementation'

type NetlifyIdentity = typeof NetlifyIdentityNS

export function createNetlifyAuth(netlifyIdentity: NetlifyIdentity) {
  const authImplementation = createNetlifyAuthImplementation(netlifyIdentity)

  isBrowser && netlifyIdentity.init()

  return createAuthentication<
    NetlifyIdentityNS.User,
    NetlifyIdentityNS.User | null,
    NetlifyIdentityNS.User | null,
    void,
    null,
    never,
    never,
    never,
    never
  >(authImplementation)
}

function createNetlifyAuthImplementation(
  netlifyIdentity: NetlifyIdentity
): AuthImplementation<
  NetlifyIdentityNS.User,
  NetlifyIdentityNS.User | null,
  NetlifyIdentityNS.User | null,
  void,
  null,
  never,
  never,
  never,
  never
> {
  return {
    type: 'netlify',
    login: () => {
      return new Promise((resolve, reject) => {
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
      return new Promise((resolve, reject) => {
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
