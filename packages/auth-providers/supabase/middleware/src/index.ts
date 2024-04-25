// import { authDecoder } from '@redwoodjs/auth-supabase-api'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

import type { GetCurrentUser } from '@redwoodjs/graphql-server'
import type {
  MiddlewareRequest,
  MiddlewareResponse,
} from '@redwoodjs/vite/middleware'

export interface SupabaseAuthMiddlewareOptions {
  getCurrentUser?: GetCurrentUser
}

export const createSupabaseAuthMiddleware = ({
  getCurrentUser,
}: SupabaseAuthMiddlewareOptions) => {
  return async (request: MiddlewareRequest, res: MiddlewareResponse) => {
    // if streaming enabled, then return the cookie decoder

    const supabase = createServerClient(
      process.env.SUPABASE_URL || '',
      process.env.SUPABASE_KEY || '',
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value || ''
          },
          set(name: string, value: string, options: CookieOptions) {
            request.cookies.set(name, value, options)
            res.cookies.set(name, value, options)
          },
          remove(name: string, _options: CookieOptions) {
            request.cookies.unset(name)
            res.cookies.unset(name)
          },
        },
      },
    )

    try {
      let currentUser, userMetadata
      // so still call lib currentUser because shape might be different
      if (!getCurrentUser) {
        currentUser = await supabase.auth.getUser()
        userMetadata = currentUser.data.user?.user_metadata
      }
      // odd place, probably set in the web auth provider?
      res.cookies.set('auth-provider', 'supabase', {})

      request.serverAuthContext.set({
        currentUser,
        loading: false,
        isAuthenticated: !!currentUser,
        hasError: false,
        userMetadata,
      })
    } catch (e) {
      // Clear server auth context
      console.error(e, 'Error in Supabase Auth Middleware')
      request.serverAuthContext.set(null)

      // Clear the supabase cookie?
      // supabase.auth.signOut() ??
      // Clear the provider cookie
      res.cookies.unset('auth-provider')
    }

    return res
  }
}
