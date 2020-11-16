import type * as NetlifyIdentityNS from 'netlify-identity-widget'

import type { AuthClient } from './'

export type NetlifyIdentity = typeof NetlifyIdentityNS

export const netlify = (client: NetlifyIdentity): AuthClient => {
  return {
    type: 'netlify',
    client,
    login: (redirectUrl) => {
      return new Promise((resolve, reject) => {
        let autoClosedModal = false
        client.open('login')
        client.on('login', (user) => {
          // This closes the modal which pops-up immediately after you login.
          autoClosedModal = true
          client.close()
          if (typeof redirectUrl != "undefined" && redirectUrl != null) {
            window.location.href = redirectUrl;
          }
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
    signup: () => {
      return new Promise((resolve, reject) => {
        client.open('signup')
        client.on('close', () => {
          resolve(null)
        })
        client.on('error', reject)
      })
    },
    getToken: async () => {
      const user = await client.currentUser()
      return user?.token?.access_token || null
    },
    getUserMetadata: async () => {
      return client.currentUser()
    },
  }
}
