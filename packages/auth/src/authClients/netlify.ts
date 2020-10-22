import * as client from 'netlify-identity-widget'

export function netlify() {
  return {
    type: 'netlify',
    client,
    login: () => {
      return new Promise<client.User | null>((resolve, reject) => {
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
      return new Promise<void>((resolve, reject) => {
        client.logout()
        client.on('logout', resolve)
        client.on('error', reject)
      })
    },
    signup: () => {
      return new Promise<void>((resolve, reject) => {
        client.open('signup')
        client.on('close', () => {
          resolve()
        })
        client.on('error', reject)
      })
    },
    getToken: () => client.currentUser()?.token?.access_token || null,
    getUserMetadata: client.currentUser,
  }
}
