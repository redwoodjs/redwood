import type {
  SupabaseClient,
  AuthResponse,
  OAuthResponse,
  SSOResponse,
  SignInWithOAuthCredentials as SbSignInWithOauthCredentials,
  SignInWithIdTokenCredentials as SbSignInWithIdTokenCredentials,
  SignInWithPasswordCredentials as SbSignInWithPasswordCredentials,
  SignInWithPasswordlessCredentials as SbSignInWithPasswordlessCredentials,
  SignInWithSSO as SbSignInWithSSO,
  SignUpWithPasswordCredentials,
} from '@supabase/supabase-js'
import { AuthError } from '@supabase/supabase-js'

import { CurrentUser, createAuthentication } from '@redwoodjs/auth'

type SignInWithOAuthCredentials = SbSignInWithOauthCredentials & {
  authType: 'OAuth'
}
type SignInWithIdTokenCredentials = SbSignInWithIdTokenCredentials & {
  authType: 'IdToken'
}
type SignInWithPasswordCredentials = SbSignInWithPasswordCredentials & {
  authType: 'Password'
}
type SignInWithPasswordlessCredentials = SbSignInWithPasswordlessCredentials & {
  authType: 'Passwordless'
}
type SignInWithSSO = SbSignInWithSSO & { authType: 'SSO' }

export function createAuth(
  supabaseClient: SupabaseClient,
  customProviderHooks?: {
    useCurrentUser?: () => Promise<Record<string, unknown>>
    useHasRole?: (
      currentUser: CurrentUser | null
    ) => (rolesToCheck: string | string[]) => boolean
  }
) {
  const authImplementation = createAuthImplementation(supabaseClient)

  return createAuthentication(authImplementation, customProviderHooks)
}

function createAuthImplementation(supabaseClient: SupabaseClient) {
  return {
    type: 'supabase',
    client: supabaseClient,
    /*
     * All Supabase Sign In
     */
    login: async (
      credentials:
        | SignInWithPasswordCredentials
        | SignInWithOAuthCredentials
        | SignInWithIdTokenCredentials
        | SignInWithPasswordlessCredentials
        | SignInWithSSO
    ): Promise<AuthResponse | OAuthResponse | SSOResponse> => {
      /**
       * Log in an existing user with an email and password or phone and password.
       *
       * Be aware that you may get back an error message that will not distinguish
       * between the cases where the account does not exist or that the
       * email/phone and password combination is wrong or that the account can only
       * be accessed via social login.
       */
      if (credentials.authType === 'Password') {
        return await supabaseClient.auth.signInWithPassword(credentials)
      }

      /**
       * Log in an existing user via a third-party provider.
       */
      if (credentials.authType === 'OAuth') {
        return await supabaseClient.auth.signInWithOAuth(credentials)
      }

      /**
       * Log in a user using magiclink or a one-time password (OTP).
       *
       * If the `{{ .ConfirmationURL }}` variable is specified in the email template, a magiclink will be sent.
       * If the `{{ .Token }}` variable is specified in the email template, an OTP will be sent.
       * If you're using phone sign-ins, only an OTP will be sent. You won't be able to send a magiclink for phone sign-ins.
       *
       * Be aware that you may get back an error message that will not distinguish
       * between the cases where the account does not exist or, that the account
       * can only be accessed via social login.
       */
      if (credentials.authType === 'Passwordless') {
        return await supabaseClient.auth.signInWithOtp(credentials)
      }

      /**
       * Attempts a single-sign on using an enterprise Identity Provider. A
       * successful SSO attempt will redirect the current page to the identity
       * provider authorization page. The redirect URL is implementation and SSO
       * protocol specific.
       *
       * You can use it by providing a SSO domain. Typically you can extract this
       * domain by asking users for their email address. If this domain is
       * registered on the Auth instance the redirect will use that organization's
       * currently active SSO Identity Provider for the login.
       *
       * If you have built an organization-specific login page, you can use the
       * organization's SSO Identity Provider UUID directly instead.
       *
       * This API is experimental and availability is conditional on correct
       * settings on the Auth service.
       *
       * @experimental
       */
      if (credentials.authType === 'SSO') {
        return await supabaseClient.auth.signInWithSSO(credentials)
      }

      /**
       * Allows signing in with an ID token issued by certain supported providers.
       * The ID token is verified for validity and a new session is established.
       *
       * @experimental
       */
      if (credentials.authType === 'IdToken') {
        return await supabaseClient.auth.signInWithIdToken(credentials)
      }

      /* Unsupported login */
      return {
        data: { user: null, session: null },
        error: new AuthError('Invalid Login Credentials'),
      }
    },
    /**
     * Inside a browser context, `signOut()` will remove the logged in user from the browser session
     * and log them out - removing all items from localstorage and then trigger a `"SIGNED_OUT"` event.
     *
     * For server-side management, you can revoke all refresh tokens for a user by passing a user's JWT through to `auth.api.signOut(JWT: string)`.
     * There is no way to revoke a user's access token jwt until it expires. It is recommended to set a shorter expiry on the jwt for this reason.
     */
    logout: async () => {
      const { error } = await supabaseClient.auth.signOut()
      if (error) {
        console.error(error)
      }

      return
    },
    /**
     * Creates a new user.
     *
     * Be aware that if a user account exists in the system you may get back an
     * error message that attempts to hide this information from the user.
     *
     * @returns A logged-in session if the server has "autoconfirm" ON
     * @returns A user if the server has "autoconfirm" OFF
     */
    signup: async (
      credentials: SignUpWithPasswordCredentials
    ): Promise<AuthResponse> => {
      return await supabaseClient.auth.signUp(credentials)
    },
    getToken: async (): Promise<string | null> => {
      const { data, error } = await supabaseClient.auth.getSession()

      if (error) {
        console.error(error)
        return null
      }

      return data?.session?.access_token ?? null
    },
    /**
     * Gets the current user metadata if there is an existing session.
     */
    getUserMetadata: async () => {
      const { data, error } = await supabaseClient.auth.getSession()

      if (error) {
        console.error(error)
        return null
      }

      return data?.session?.user?.user_metadata ?? null
    },
    /**
     * Restore Redwood authentication state when an OAuth or magiclink
     * callback redirects back to site with access token
     * by restoring the Supabase auth session.
     *
     * Initializes the Supabase client session either from the url or from storage.
     * This method is automatically called when instantiating the client, but should also be called
     * manually when checking for an error from an auth redirect (oauth, magiclink, password recovery, etc).
     */
    restoreAuthState: async () => {
      try {
        await supabaseClient.auth.refreshSession()

        // Modify URL state only if there is a session.
        // Prevents resetting URL state (like query params) for all other cases.
        window.history.replaceState(
          {},
          document.title,
          window.location.pathname
        )
      } catch (error) {
        console.error(error)
      }
      return
    },
  }
}
