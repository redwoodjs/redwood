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
// NOTE: 2021-09-07 why can't we use ProviderId exported from firebase-sdk-js v9.0.0 and above?
export type oAuthProvider =
  | 'google.com'
  | 'facebook.com'
  | 'github.com'
  | 'twitter.com'
  | 'microsoft.com'
  | 'apple.com'

export type Prompt = 'none' | 'consent' | 'select_account'

// valid parameters as of 2021-06-12 at https://firebase.google.com/docs/reference/js/firebase.auth.GoogleAuthProvider#setcustomparameters
// export type CustomParameters = {
//   hd?: string
//   include_granted_scopes?: boolean
//   login_hint?: string
//   prompt?: Prompt
// }
// NOTE: 2021-09-07 propose changing to use CustomParameters type exported by firebase-js-sdk v9.0.0 and above
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

  const sendEmailLink = (options: Options) => {
    if (options.email) {
      window.localStorage.setItem('emailForSignIn', options.email)
    }
    return sendSignInLinkToEmail(auth, options.email, actionCodeSettings)
  }

  const emailLinkSignIn = (options: Options) => {
    if (!options.emailLink) {
      throw new Error(
        `options.emailLink not set while providerId = ${options.providerId}`
      )
    }
    // Perhaps makes more sense to do validation in email signin page handler?
    if (!isSignInWithEmailLink(auth, options.emailLink)) {
      throw new Error('invalid emailLink')
    }
    // TODO enforce that options.email is set
    // BUT checking for email might be better to do in handler, so we can prompt user
    return signInWithEmailLink(auth, options.email, options.emailLink)
  }

  // restoreAuthState?(): void | Promise<any>
  // getUserMetadata(): Promise<null | SupportedUserMetadata>
  return {
    type: 'firebase', // ??? actually isn't this type is different than component's prop type?
    client: auth,
    //restoreAuthState -- perhaps use refreshtoken to reauth?
    login: async (
      options: oAuthProvider | Options = { providerId: 'google.com' }
    ) => {
      if (typeof options === 'string') {
        options = { providerId: options }
      }

      if (hasPasswordCreds(options)) {
        return signInWithEmailAndPassword(auth, options.email, options.password)
      }

      if (options.providerId === 'emailLink') {
        if (!options.emailLink) {
          return sendEmailLink(options)
        } else {
          return emailLinkSignIn(options)
        }
      }

      const provider = getProvider(options.providerId || 'google.com')
      const providerWithOptions = applyProviderOptions(provider, options)
      // TODO perhaps take userCred instead of doing popup here
      // that is we could make pop the app's responsibility
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
        if (!options.emailLink) {
          return sendEmailLink(options)
        } else {
          return emailLinkSignIn(options)
        }
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
