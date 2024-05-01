import { AUTH_PROVIDER_HEADER } from '@redwoodjs/api'
import { authDecoder } from '@redwoodjs/auth-supabase-api'
import type { GetCurrentUser } from '@redwoodjs/graphql-server'
import type { MiddlewareRequest } from '@redwoodjs/vite/middleware'
import type { MiddlewareResponse } from '@redwoodjs/vite/middleware'

import { clearSupabaseCookies } from './util'

export interface SupabaseAuthMiddlewareOptions {
  getCurrentUser: GetCurrentUser
}

/**
 * Create Supabase Auth Middleware that sets the `serverAuthContext` based on the Supabase cookie.
 */
const createSupabaseAuthMiddleware = ({
  getCurrentUser,
}: SupabaseAuthMiddlewareOptions) => {
  return async (req: MiddlewareRequest, res: MiddlewareResponse) => {
    const type = 'supabase'
    const cookieHeader = req.headers.get('cookie')

    // Not an authenticated request, pass through
    if (!cookieHeader) {
      return res
    }

    try {
      const authProviderCookie = req.cookies.get(AUTH_PROVIDER_HEADER)

      // if there is no auth-provider cookie, or it is not for supabase
      // then we don't need to do anything
      if (!authProviderCookie || authProviderCookie !== type) {
        return res
      }

      // Supabase decoder actually doesn't care about the token/cookieHeader
      // We just pass it in for consistency with other auth providers
      const decoded = await authDecoder(cookieHeader, type, {
        event: req as Request,
      })

      const currentUser = await getCurrentUser(
        decoded,
        { type: type, token: cookieHeader, schema: 'cookie' },
        { event: req as Request },
      )

      if (req.url.includes(`/middleware/supabase/currentUser`)) {
        // Reuse the response object, so this middleware can be chained
        res.body =
          // Not sure how currentUser can be string.... but types say so
          typeof currentUser === 'string'
            ? currentUser
            : JSON.stringify({ currentUser })

        return res
      }

      const userMetadata =
        typeof currentUser === 'string' ? null : currentUser?.['user_metadata']

      req.serverAuthContext.set({
        currentUser,
        loading: false,
        isAuthenticated: !!currentUser,
        hasError: false,
        userMetadata: userMetadata || currentUser,
      })
    } catch (e) {
      console.error(e, 'Error in Supabase Auth Middleware')
      clearSupabaseCookies(req, res)
      return res
    }

    return res
  }
}
export default createSupabaseAuthMiddleware
