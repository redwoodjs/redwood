import type { SupabaseClient, Provider } from '@supabase/supabase-js'

import { CurrentUser, createAuthentication } from '@redwoodjs/auth'

type SignInOptions = {
  email?: string | undefined
  password?: string | undefined
  phone?: string | undefined
  provider?: Provider
  refreshToken?: string
  redirectTo?: string
  scopes?: string
}

type SignUpOptions = {
  email?: string
  password?: string
  phone?: string
  redirectTo?: string
}

export function createSupabaseAuth(
  supabaseClient: SupabaseClient,
  customProviderHooks?: {
    useCurrentUser?: () => Promise<Record<string, unknown>>
    useHasRole?: (
      currentUser: CurrentUser | null
    ) => (rolesToCheck: string | string[]) => boolean
  }
) {
  const authImplementation = createSupabaseAuthImplementation(supabaseClient)

  return createAuthentication(authImplementation, customProviderHooks)
}

function createSupabaseAuthImplementation(supabaseClient: SupabaseClient) {
  return {
    type: 'supabase',
    client: supabaseClient,
    /**
     * Log in an existing user, or login via a third-party provider.
     *
     * @param options The user login details.
     * @param options.email The user's email address.
     * @param options.password The user's password.
     * @param options.phone The user's phone number.
     * @param options.refreshToken A valid refresh token that was returned on login.
     * @param options.provider One of the supported third-party providers.
     * @see https://supabase.com/docs/guides/auth#third-party-logins
     * @param redirectTo A URL or mobile address to send the user to after they are confirmed.
     * @param scopes A space-separated list of scopes granted to the OAuth application.
     */
    login: ({
      email,
      password,
      phone,
      provider,
      refreshToken,
      redirectTo,
      scopes,
    }: SignInOptions) => {
      return supabaseClient.auth.signIn(
        { email, phone, password, refreshToken, provider },
        { redirectTo, scopes }
      )
    },
    logout: async () => {
      return await supabaseClient.auth.signOut()
    },
    /**
     * Creates a new user.
     *
     * @param options The user login details.
     * @param options.email The user's email address.
     * @param options.password The user's password.
     * @param options.phone The user's phone number.
     * @param redirectTo A URL or mobile address to send the user to after they are confirmed.
     */
    signup: async ({ email, password, phone, redirectTo }: SignUpOptions) => {
      return await supabaseClient.auth.signUp(
        { email, password, phone },
        { redirectTo }
      )
    },
    getToken: async () => {
      const currentSession = supabaseClient.auth.session()
      return currentSession?.access_token || null
    },
    getUserMetadata: async () => {
      return await supabaseClient.auth.user()
    },
    /**
     * Restore Redwood authentication state when an OAuth or magiclink
     * callback redirects back to site with access token
     * by restoring the Supabase auth session
     */
    restoreAuthState: async () => {
      const { data: session } = await supabaseClient.auth.getSessionFromUrl()

      // Modify URL state only if there is a session.
      // Prevents resetting URL state (like query params) for all other cases.
      if (session) {
        window.history.replaceState(
          {},
          document.title,
          window.location.pathname
        )
      }

      return
    },
  }
}
