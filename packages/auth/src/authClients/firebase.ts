import type * as firebase from 'firebase/app'

export type FirebaseClient = typeof firebase

import { AuthClient } from './'

export const mapAuthClientFirebase = (client: FirebaseClient): AuthClient => {
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
    getToken: async () => client.auth().currentUser?.getIdToken() ?? null,
    getUserMetadata: async () => client.auth().currentUser,
  }
}
