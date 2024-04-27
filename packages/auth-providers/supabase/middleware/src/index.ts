// import type { CookieOptions } from '@supabase/ssr'

import { authDecoder } from '@redwoodjs/auth-supabase-api'
import type { GetCurrentUser } from '@redwoodjs/graphql-server'
import type { MiddlewareRequest } from '@redwoodjs/vite/middleware'
import { MiddlewareResponse } from '@redwoodjs/vite/middleware'

export interface SupabaseAuthMiddlewareOptions {
  getCurrentUser: GetCurrentUser
}

const clearCookies = (
  req: MiddlewareRequest,
  res: MiddlewareResponse,
  name: string,
) => {
  req.cookies.unset(name)
  res.cookies.unset(name)
}

const clearAuthProviderCookie = (
  req: MiddlewareRequest,
  res: MiddlewareResponse,
) => {
  clearCookies(req, res, 'auth-provider')
}

export const createSupabaseAuthMiddleware = ({
  getCurrentUser,
}: SupabaseAuthMiddlewareOptions) => {
  return async (req: MiddlewareRequest, res: MiddlewareResponse) => {
    const type = 'supabase'
    const token = ''

    try {
      const authProviderCookie = req.cookies.get('auth-provider')
      // if there is no auth-provider cookie, or it is for supabase
      // then we don't need to do anything
      if (!authProviderCookie || authProviderCookie !== type) {
        return res
      }

      // Since the Supabase authDecoder will know if it should use the cookie or the JWT,
      // there is no need to pass a token here
      const decoded = await authDecoder(token, type, {
        event: req as Request,
        context: {},
      })

      const currentUser = await getCurrentUser(
        decoded,
        { type: type, token, schema: 'cookie' },
        { event: req as Request, context: {} },
      )

      const userMetadata =
        typeof currentUser === 'string' ? null : currentUser?.['user_metadata']

      if (req.url.includes(`/middleware/supabase/currentUser`)) {
        if (typeof currentUser === 'string') {
          return new MiddlewareResponse(currentUser)
        }
        return new MiddlewareResponse(JSON.stringify({ currentUser }))
      }

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

      clearAuthProviderCookie(req, res)
    }

    return res
  }
}
