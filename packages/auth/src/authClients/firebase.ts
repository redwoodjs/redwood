import { AuthClient } from './'

import {
  isSignInWithEmailLink,
  sendSignInLinkToEmail,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  OAuthProvider,
  signInWithEmailLink,
  signInWithPopup,
} from '@firebase/auth'


import type { ActionCodeSettings, User } from '@firebase/auth'
export type FirebaseUser = User

import { Auth as FirebaseAuth } from '@firebase/auth'
export type Firebase = typeof FirebaseAuth

import type { CustomParameters } from '@firebase/auth'

export type emailLinkProvider = 'emailLink'

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


// valid parameters as of 2021-06-12 at https://firebase.google.com/docs/reference/js/firebase.auth.GoogleAuthProvider#setcustomparameters
// NOTE: 2021-09-07 propose removing this and just using CustomParameters type exported by firebase-js-sdk ^v9.0.0
// export type Prompt = 'none' | 'consent' | 'select_account'
// export type CustomParameters = {
//   hd?: string
//   include_granted_scopes?: boolean
//   login_hint?: string
//   prompt?: Prompt
// }
export type Options = {
  providerId?: oAuthProvider | emailLinkProvider
  email?: string
  emailLink?: string
  password?: string
  scopes?: string[] // scopes available at https://developers.google.com/identity/protocols/oauth2/scopes
  customParameters?: CustomParameters
}

const hasPasswordCreds = (options: Options): boolean => {
  return options.email !== undefined && options.password !== undefined
}

export const firebase = (
  auth: FirebaseAuth,
  actionCodeSettings?: ActionCodeSettings
): AuthClient => {
  // Use a function to allow us to extend for non-oauth providers in the future
  const getProvider = (providerId: oAuthProvider) => {
    return new OAuthProvider(providerId)
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
      return sendSignInLinkToEmail(auth, email, actionCodeSettings)
    }
    // otherwise validate emailLink
    if (!isSignInWithEmailLink(auth, emailLink)) {
      throw new Error('not a valid emailLink')
    }

    return signInWithEmailLink(auth, email, emailLink)
  }

  // restoreAuthState?(): void | Promise<any>
  return {
    type: 'firebase',
    client: auth,
    //restoreAuthState -- perhaps use refreshtoken to reauth?
    login: async (
      options: oAuthProvider | Options = { providerId: 'google.com' }
    ) => {
      // If argument provided is a string, it should be the oAuth Provider
      // Cast the provider string into the options object
      if (typeof options === 'string') {
        options = { providerId: options }
      }

      if (hasPasswordCreds(options)) {
        return signInWithEmailAndPassword(auth, options.email, options.password)
      }

      if (options.providerId === 'emailLink') {
        return loginWithEmailLink(options)
      }

      const provider = getProvider(options.providerId || 'google.com')
      const providerWithOptions = applyProviderOptions(provider, options)

      return signInWithPopup(auth, providerWithOptions)
    },
    logout: async () => auth.signOut(),
    signup: (
      options: oAuthProvider | Options = { providerId: 'google.com' }
    ) => {
      if (typeof options === 'string') {
        options = { providerId: options }
      }

      if (hasPasswordCreds(options)) {
        return createUserWithEmailAndPassword(
          auth,
          options.email,
          options.password
        )
      }

      if (options.providerId === 'emailLink') {
        return loginWithEmailLink(options)
      }

      const provider = getProvider(options.providerId || 'google.com')
      const providerWithOptions = applyProviderOptions(provider, options)
      return signInWithPopup(auth, providerWithOptions)
    },
    getToken: async () => {
      return auth.currentUser ? auth.currentUser.getIdToken() : null
    },
    getUserMetadata: async () => {
      return auth.currentUser
    },
  }
}
