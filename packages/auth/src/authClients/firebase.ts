import type { FirebaseApp } from '@firebase/app'
import type {
  ActionCodeSettings,
  CustomParameters,
  OAuthProvider,
  User,
} from '@firebase/auth'
import type FirebaseAuthNamespace from '@firebase/auth'

import { AuthClient } from './'

export type FirebaseAuth = typeof FirebaseAuthNamespace
export type FirebaseUser = User

// @TODO: Firebase doesn't export a list of providerIds they use
// But I found them here: https://github.com/firebase/firebase-js-sdk/blob/a5768b0aa7d7ce732279931aa436e988c9f36487/packages/rules-unit-testing/src/api/index.ts
// NOTE: 2021-09-07 firebase has a const/enum ProviderId they export
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

type FirebaseClient = {
  firebaseAuth: FirebaseAuth
  firebaseApp?: FirebaseApp
  actionCodeSettings?: ActionCodeSettings
}

export const firebase = (client: FirebaseClient): AuthClient => {
  const { firebaseAuth, firebaseApp, actionCodeSettings } = client
  const auth = firebaseAuth.getAuth(firebaseApp)

  function getProvider(providerId: string) {
    return new firebaseAuth.OAuthProvider(providerId)
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

  const loginWithEmailLink = ({ email, emailLink }: Options) => {
    // send emailLink if logIn called with no emailLink
    if (!emailLink) {
      return firebaseAuth.sendSignInLinkToEmail(
        auth,
        email as string,
        actionCodeSettings as ActionCodeSettings
      )
    }

    if (!firebaseAuth.isSignInWithEmailLink(auth, emailLink)) {
      throw new Error('Login failed, invalid email link')
    }

    return firebaseAuth.signInWithEmailLink(
      auth,
      email as string,
      emailLink as string
    )
  }

  return {
    type: 'firebase',
    client: auth,
    restoreAuthState: () => {
      // return a promise that we be await'd on for first page load until firebase
      // auth has loaded, indicated by the first firing of onAuthStateChange)
      return new Promise((resolve, reject) => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
          unsubscribe()
          resolve(user)
        }, reject)
      })
      return
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
