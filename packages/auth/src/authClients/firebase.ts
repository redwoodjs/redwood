import * as client from 'firebase/app'

export const firebase = () => {
  return {
    type: 'firebase',
    client,
    restoreAuthState: () => client.auth().getRedirectResult(),
    // TODO: Allow the user to define the `AuthProvider`
    login: async () => {
      const provider = new client.auth.GoogleAuthProvider()
      return client.auth().signInWithRedirect(provider)
    },
    logout: () => client.auth().signOut(),
    signup: async () => {
      const provider = new client.auth.GoogleAuthProvider()
      return client.auth().signInWithRedirect(provider)
    },
    getToken: async () => client.auth().currentUser?.getIdToken() ?? null,
    getUserMetadata: async () => client.auth().currentUser,
  }
}
