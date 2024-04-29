// import type { CookieOptions } from '@supabase/ssr'

import { authDecoder } from '@redwoodjs/auth-supabase-api'
import type { GetCurrentUser } from '@redwoodjs/graphql-server'
import type { MiddlewareRequest } from '@redwoodjs/vite/middleware'
import { MiddlewareResponse } from '@redwoodjs/vite/middleware'

export interface SupabaseAuthMiddlewareOptions {
  getCurrentUser: GetCurrentUser
}

// const clearCookies = (
//   req: MiddlewareRequest,
//   res: MiddlewareResponse,
//   name: string,
// ) => {
//   req.cookies.unset(name)
//   res.cookies.unset(name)
// }

// const clearAuthProviderCookie = (
//   req: MiddlewareRequest,
//   res: MiddlewareResponse,
// ) => {
//   clearCookies(req, res, 'auth-provider')
// }

/**
 * Create Supabase Auth Middleware that sets the `serverAuthContext` based on the Supabase cookie.
 */
export const createSupabaseAuthMiddleware = ({
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
      const authProviderCookie = req.cookies.get('auth-provider')

      // if there is no auth-provider cookie, or it is not for supabase
      // then we don't need to do anything
      if (!authProviderCookie || authProviderCookie !== type) {
        return res
      }

      // Supabase actually doesn't care about the token/cookieHeader
      // We just pass it in for consistency with other auth providers
      const decoded = await authDecoder(cookieHeader, type, {
        event: req as Request,
      }) //

      const currentUser = await getCurrentUser(
        decoded,
        { type: type, token: cookieHeader, schema: 'cookie' },
        { event: req as Request },
      )

      if (req.url.includes(`/middleware/supabase/currentUser`)) {
        if (typeof currentUser === 'string') {
          return new MiddlewareResponse(currentUser)
        }

        return new MiddlewareResponse(JSON.stringify({ currentUser }))
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
      // Clear server auth context
      console.error(e, 'Error in Supabase Auth Middleware')
      req.serverAuthContext.set(null)

      // Clear the supabase cookie?
      // supabase.auth.signOut() ??
      // TODO: Ask Supabase how to get cookie name
      req.cookies.unset('auth-provider')
      res.cookies.unset('auth-provider')
    }

    return res
  }
}
