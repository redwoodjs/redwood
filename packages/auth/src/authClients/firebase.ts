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
// NOTE: 2021-09-07 could we replace this with ProviderId type now exported from firebase-sdk-js ^v9.0.0
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
  firebase: FirebaseAuth
  actionCodeSettings?: ActionCodeSettings
}

export const firebase = (client: FirebaseClient): AuthClient => {
  const { firebase, actionCodeSettings } = client
  const auth = firebase.getAuth()

  function getProvider(providerId: string) {
    return new firebase.OAuthProvider(providerId)
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
    // dispatch to signIn step1 based on if no emailLink has been provided
    if (!emailLink) {
      return firebase.sendSignInLinkToEmail(
        auth,
        email as string,
        actionCodeSettings as ActionCodeSettings
      )
    }
    // otherwise validate emailLink
    if (!firebase.isSignInWithEmailLink(auth, emailLink)) {
      throw new Error('Login failed, invalid email link')
    }

    return firebase.signInWithEmailLink(
      auth,
      email as string,
      emailLink as string
    )
  }

  return {
    type: 'firebase',
    client: auth,
    restoreAuthState: async () => {
      await auth.currentUser?.reload()
      return auth.currentUser
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
        return firebase.signInWithEmailAndPassword(
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

      return firebase.signInWithPopup(auth, providerWithOptions)
    },
    logout: async () => auth.signOut(),
    signup: (
      options: oAuthProvider | Options = { providerId: 'google.com' }
    ) => {
      if (typeof options === 'string') {
        options = { providerId: options }
      }

      if (hasPasswordCreds(options)) {
        return firebase.createUserWithEmailAndPassword(
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
      return firebase.signInWithPopup(auth, providerWithOptions)
    },
    getToken: async () => {
      return auth.currentUser ? auth.currentUser.getIdToken() : null
    },
    getUserMetadata: async () => {
      return auth.currentUser
    },
  }
}
