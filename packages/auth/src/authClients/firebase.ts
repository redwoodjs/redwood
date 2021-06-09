import type FirebaseNamespace from 'firebase/app'

import { AuthClient } from './'

export type Firebase = typeof FirebaseNamespace

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
  // Firebase auth functions return a goog.Promise which as of 2021-05-12 does
  // not appear to work with try {await} catch blocks as exceptions are not caught.
  // This client returns a new standard Promise so that the exceptions can be
  // caught and no changes are required in common auth code located in AuthProvider.tsx
  const repackagePromise = (
    fireBasePromise: Promise<any | string>
  ): Promise<any | string> => {
    return new Promise((resolve, reject) => {
      fireBasePromise
        .then((result) => resolve(result))
        .catch((error) => reject(error))
    })
  }

  return {
    type: 'firebase',
    client,
    restoreAuthState: () => repackagePromise(client.auth().getRedirectResult()),
    login: (withAuth: oAuthProvider | PasswordCreds = 'google.com') => {
      if (isPasswordCreds(withAuth)) {
        return repackagePromise(
          client
            .auth()
            .signInWithEmailAndPassword(withAuth.email, withAuth.password)
        )
      }

      const provider = getProvider(withAuth)
      return client.auth().signInWithPopup(provider)
    },
    logout: () => repackagePromise(client.auth().signOut()),
    signup: (withAuth: oAuthProvider | PasswordCreds = 'google.com') => {
      if (isPasswordCreds(withAuth)) {
        return repackagePromise(
          client
            .auth()
            .createUserWithEmailAndPassword(withAuth.email, withAuth.password)
        )
      }

      const provider = getProvider(withAuth)
      return repackagePromise(client.auth().signInWithPopup(provider))
    },
    getToken: () => {
      const currentUser = client.auth().currentUser
      if (currentUser) {
        return repackagePromise(currentUser.getIdToken())
      }
      return new Promise(() => {
        return null
      })
    },
    getUserMetadata: async () => client.auth().currentUser,
  }
}
