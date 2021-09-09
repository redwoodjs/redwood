import type {
  ActionCodeSettings,
  Auth as FirebaseAuth,
  AuthProvider as FirebaseAuthProvider,
  CustomParameters,
  OAuthProvider,
  PopupRedirectResolver,
  User,
  UserCredential,
} from '@firebase/auth'

import { AuthClient } from './'

export type FirebaseUser = User
export type Firebase = FirebaseAuth
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

type FirebaseMethods = {
  createUserWithEmailAndPassword(
    auth: FirebaseAuth,
    email: string,
    password: string
  ): Promise<UserCredential>
  isSignInWithEmailLink(auth: FirebaseAuth, emailLink: string): boolean
  sendSignInLinkToEmail(
    auth: FirebaseAuth,
    email: string,
    actionCodeSettings: ActionCodeSettings
  ): Promise<void>
  signInWithEmailAndPassword(
    auth: FirebaseAuth,
    email: string,
    password: string
  ): Promise<UserCredential>
  signInWithEmailLink(
    auth: FirebaseAuth,
    email: string,
    emailLink?: string
  ): Promise<UserCredential>
  signInWithPopup(
    auth: FirebaseAuth,
    provider: FirebaseAuthProvider,
    resolver?: PopupRedirectResolver
  ): Promise<UserCredential>
}

type FirebaseClient = {
  auth: FirebaseAuth
  f: FirebaseMethods
  getProvider(providerId: string): OAuthProvider
  actionCodeSettings?: ActionCodeSettings
}

export const firebase = (client: FirebaseClient): AuthClient => {
  const { auth, f, getProvider, actionCodeSettings } = client

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
      return f.sendSignInLinkToEmail(
        auth,
        email as string,
        actionCodeSettings as ActionCodeSettings
      )
    }
    // otherwise validate emailLink
    if (!f.isSignInWithEmailLink(auth, emailLink)) {
      throw new Error('Login failed, invalid email link')
    }

    return f.signInWithEmailLink(auth, email as string, emailLink as string)
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
        return f.signInWithEmailAndPassword(
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

      return f.signInWithPopup(auth, providerWithOptions)
    },
    logout: async () => auth.signOut(),
    signup: (
      options: oAuthProvider | Options = { providerId: 'google.com' }
    ) => {
      if (typeof options === 'string') {
        options = { providerId: options }
      }

      if (hasPasswordCreds(options)) {
        return f.createUserWithEmailAndPassword(
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
      return f.signInWithPopup(auth, providerWithOptions)
    },
    getToken: async () => {
      return auth.currentUser ? auth.currentUser.getIdToken() : null
    },
    getUserMetadata: async () => {
      return auth.currentUser
    },
  }
}
