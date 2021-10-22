import type { FirebaseApp } from '@firebase/app'
import type { CustomParameters, OAuthProvider, User } from '@firebase/auth'
import type FirebaseAuthNamespace from '@firebase/auth'

import { AuthClient } from './'

export type FirebaseAuth = typeof FirebaseAuthNamespace
export type FirebaseUser = User

// @TODO: Firebase doesn't export a list of providerIds they use
// But I found them here: https://github.com/firebase/firebase-js-sdk/blob/a5768b0aa7d7ce732279931aa436e988c9f36487/packages/rules-unit-testing/src/api/index.ts
// NOTE 10/21/21: Firebase does appear to export a const enum_map of providerIds:
// https://github.com/firebase/firebase-js-sdk/blob/master/packages/auth/src/model/enum_maps.ts#L28-L46
// It may be possible to just use the exported enum map ala https://github.com/redwoodjs/redwood/pull/3537/files#r733851673
export type oAuthProvider =
  | 'google.com'
  | 'facebook.com'
  | 'github.com'
  | 'twitter.com'
  | 'microsoft.com'
  | 'apple.com'

export type emailLinkProvider = 'emailLink'
export type customTokenProvider = 'customToken'

export type Options = {
  providerId?: oAuthProvider | emailLinkProvider | customTokenProvider
  email?: string
  emailLink?: string
  customToken?: string
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

export type FirebaseClient = {
  firebaseAuth: FirebaseAuth
  firebaseApp?: FirebaseApp
}

export const firebase = ({
  firebaseAuth,
  firebaseApp,
}: FirebaseClient): AuthClient => {
  const auth = firebaseAuth.getAuth(firebaseApp)

  function getProvider(providerId: string) {
    return new firebaseAuth.OAuthProvider(providerId)
  }

  const loginWithEmailLink = ({ email, emailLink }: Options) => {
    if (
      email !== undefined &&
      emailLink !== undefined &&
      firebaseAuth.isSignInWithEmailLink(auth, emailLink)
    ) {
      return firebaseAuth.signInWithEmailLink(auth, email, emailLink)
    }
    return undefined
  }

  return {
    type: 'firebase',
    client: auth,
    restoreAuthState: () => {
      // The first firing of onAuthStateChange indicates that firebase auth has
      // loaded and the state is ready to be read. Unsubscribe after this first firing.
      return new Promise((resolve, reject) => {
        const unsubscribe = auth.onAuthStateChanged((user: User | null) => {
          unsubscribe()
          resolve(user)
        }, reject)
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
        return firebaseAuth.signInWithEmailAndPassword(
          auth,
          options.email as string,
          options.password as string
        )
      }

      if (options.providerId === 'emailLink') {
        return loginWithEmailLink(options)
      }

      if (options.providerId === 'customToken' && options.customToken) {
        return firebaseAuth.signInWithCustomToken(auth, options.customToken)
      }

      const provider = getProvider(options.providerId || 'google.com')
      const providerWithOptions = applyProviderOptions(provider, options)

      return firebaseAuth.signInWithPopup(auth, providerWithOptions)
    },
    logout: async () => auth.signOut(),
    signup: (
      options: oAuthProvider | Options = { providerId: 'google.com' }
    ) => {
      if (typeof options === 'string') {
        options = { providerId: options }
      }

      if (hasPasswordCreds(options)) {
        return firebaseAuth.createUserWithEmailAndPassword(
          auth,
          options.email as string,
          options.password as string
        )
      }

      if (options.providerId === 'emailLink') {
        return loginWithEmailLink(options)
      }

      if (options.providerId === 'customToken' && options.customToken) {
        return firebaseAuth.signInWithCustomToken(auth, options.customToken)
      }

      const provider = getProvider(options.providerId || 'google.com')
      const providerWithOptions = applyProviderOptions(provider, options)

      return firebaseAuth.signInWithPopup(auth, providerWithOptions)
    },
    getToken: async () => {
      return auth.currentUser ? auth.currentUser.getIdToken() : null
    },
    getUserMetadata: async () => {
      return auth.currentUser
    },
  }
}
