import type * as Firebase from 'firebase/app'

import type { AuthClient } from './'

export type Firebase = typeof Firebase

export interface AuthClientFirebase extends AuthClient {
  signUp(options: { email: string; password: string }): Promise<any>
  login(options: {email?: string, password?: string}): Promise<any>
}

export const firebase = (client: Firebase): AuthClientFirebase => {
  return {
    type: 'firebase',
    client,
    signUp: ({ email, password }) => {
      return client.auth().createUserWithEmailAndPassword(email, password)
    },
    restoreAuthState: () => client.auth().getRedirectResult(),
    // TODO: Allow the user to define the `AuthProvider`
    login: async ({email, password}) => {
      if(email && password){
        return client.auth().signInWithEmailAndPassword(email, password)
      }
      const provider = new client.auth.GoogleAuthProvider()
      return client.auth().signInWithRedirect(provider)
    },
    logout: () => client.auth().signOut(),
    getToken: async () => client.auth().currentUser?.getIdToken() ?? null,
    getUserMetadata: async () => client.auth().currentUser,
  }
}
