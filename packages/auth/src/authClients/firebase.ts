import type { FirebaseApp } from '@firebase/app'
import type { CustomParameters, OAuthProvider, User } from '@firebase/auth'
import type FirebaseAuthNamespace from '@firebase/auth'

import { AuthClient } from './'

export type FirebaseAuth = typeof FirebaseAuthNamespace
export type FirebaseUser = User

// @TODO: Firebase doesn't export a list of providerIds they use
// But I found them here: https://github.com/firebase/firebase-js-sdk/blob/a5768b0aa7d7ce732279931aa436e988c9f36487/packages/rules-unit-testing/src/api/index.ts
// NOTE: 2021-09-15 firebase now exports a const/enum ProviderId which could perhabps be used in place of this
export type oAuthProvider =
  | 'google.com'
  | 'facebook.com'
  | 'github.com'
  | 'twitter.com'
  | 'microsoft.com'
  | 'apple.com'

export type emailLinkProvider = 'emailLink'

export type Options = {
  providerId?: oAuthProvider | emailLinkProvider
  email?: string
  emailLink?: string
  password?: string
  scopes?: string[] // scopes available at https://developers.google.com/identity/protocols/oauth2/scopes
  customParameters?: CustomParameters // parameters available at https://firebase.google.com/docs/reference/js/firebase.auth.GoogleAuthProvider#setcustomparameters
}

const hasPasswordCreds = (options: Options): boolean => {
  return options.email !== undefined && options.password !== undefined
}

const applyProviderOptions = (
  provider: OAuthProvider,
  options: Options
): OAuthProvider => {
  if (options.customParameters) {
    provider.setCustomParameters(options.customParameters)
  }
  if (options.scopes) {
    options.scopes.forEach((scope) => provider.addScope(scope))
  }
  return provider
}

export const firebase = (firebaseApp: FirebaseApp): AuthClient => {
  const {
    getAuth,
    signInWithEmailAndPassword,
    signInWithEmailLink,
    isSignInWithEmailLink,
    OAuthProvider,
    signInWithPopup,
    createUserWithEmailAndPassword,
  } = require('firebase/auth') as FirebaseAuth
  // This is an instance of the firebase authclient
  const authClient = getAuth(firebaseApp)

  function getProvider(providerId: string) {
    return new OAuthProvider(providerId)
  }

  const loginWithEmailLink = ({ email, emailLink }: Options) => {
    if (
      email !== undefined &&
      emailLink !== undefined &&
      isSignInWithEmailLink(authClient, emailLink)
    ) {
      return signInWithEmailLink(authClient, email, emailLink)
    }
    return undefined
  }

  return {
    type: 'firebase',
    client: authClient,
    restoreAuthState: () => {
      // return a promise that we be await'd on for first page load until firebase
      // auth has loaded, indicated by the first firing of onAuthStateChange)
      return new Promise((resolve, reject) => {
        const unsubscribe = authClient.onAuthStateChanged(
          (user: User | null) => {
            unsubscribe()
            resolve(user)
          },
          reject
        )
      })
    },
    login: async (
      options: oAuthProvider | Options = { providerId: 'google.com' }
    ) => {
      // If argument provided is a string, it should be the oAuth Provider
      // Cast the provider string into the options object
      if (typeof options === 'string') {
        options = { providerId: options }
      }

      if (hasPasswordCreds(options)) {
        return signInWithEmailAndPassword(
          authClient,
          options.email as string,
          options.password as string
        )
      }

      if (options.providerId === 'emailLink') {
        return loginWithEmailLink(options)
      }

      const provider = getProvider(options.providerId || 'google.com')
      const providerWithOptions = applyProviderOptions(provider, options)

      return signInWithPopup(authClient, providerWithOptions)
    },
    logout: async () => authClient.signOut(),
    signup: (
      options: oAuthProvider | Options = { providerId: 'google.com' }
    ) => {
      if (typeof options === 'string') {
        options = { providerId: options }
      }

      if (hasPasswordCreds(options)) {
        return createUserWithEmailAndPassword(
          authClient,
          options.email as string,
          options.password as string
        )
      }

      if (options.providerId === 'emailLink') {
        return loginWithEmailLink(options)
      }

      const provider = getProvider(options.providerId || 'google.com')
      const providerWithOptions = applyProviderOptions(provider, options)

      // Potentially useful to support signInWithCredential without popup
      return signInWithPopup(authClient, providerWithOptions)
    },
    getToken: async () => {
      return authClient.currentUser ? authClient.currentUser.getIdToken() : null
    },
    getUserMetadata: async () => {
      return authClient.currentUser
    },
  }
}
