import type * as Firebase from 'firebase/app'

export type Firebase = typeof Firebase

import { AuthClient } from './'

// @TODO: Firebase doesn't export a list of providerIds they use
// But I found them here: https://github.com/firebase/firebase-js-sdk/blob/a5768b0aa7d7ce732279931aa436e988c9f36487/packages/rules-unit-testing/src/api/index.ts
export type oAuthProvider =
  | 'google.com'
  | 'facebook.com'
  | 'github.com'
  | 'twitter.com'
  | 'microsoft.com'
  | 'apple.com'

export type PasswordCreds = { email: string; password: string }

const isPasswordCreds = (
  withCreds: oAuthProvider | PasswordCreds
): withCreds is PasswordCreds => {
  const creds = withCreds as PasswordCreds
  return creds.email !== undefined && creds.password !== undefined
}

export const firebase = (client: Firebase): AuthClient => {
  // Use a function to allow us to extend for non-oauth providers in the future
  const getProvider = (providerId: oAuthProvider) => {
    return new client.auth.OAuthProvider(providerId)
  }

  return {
    type: 'firebase',
    client,
    restoreAuthState: () => client.auth().getRedirectResult(),
    login: async (withAuth: oAuthProvider | PasswordCreds = 'google.com') => {
      if (isPasswordCreds(withAuth)) {
        return client
          .auth()
          .signInWithEmailAndPassword(withAuth.email, withAuth.password)
      }

      const provider = getProvider(withAuth)
      return client.auth().signInWithPopup(provider)
    },
    logout: () => client.auth().signOut(),
    signup: async (withAuth: oAuthProvider | PasswordCreds = 'google.com') => {
      if (isPasswordCreds(withAuth)) {
        return client
          .auth()
          .createUserWithEmailAndPassword(withAuth.email, withAuth.password)
      }

      const provider = getProvider(withAuth)
      return client.auth().signInWithPopup(provider)
    },
    getToken: async () => client.auth().currentUser?.getIdToken() ?? null,
    getUserMetadata: async () => client.auth().currentUser,
  }
}
