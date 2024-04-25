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
            return request.cookies.get(name)?.valueOf() || ''
          },
          set(name: string, value: string, options: CookieOptions) {
            request.cookies.set(name, value, options)
            res.cookies.set(name, value, options)

            request.cookies.set('auth-provider', 'supabase', {
              path: '/',
              ...options,
            })
            res.cookies.set('auth-provider', 'supabase', {
              path: '/',
              ...options,
            })
          },
          remove(name: string, _options: CookieOptions) {
            request.cookies.unset(name)
            res.cookies.unset(name)
            request.cookies.unset('auth-provider')
            res.cookies.unset('auth-provider')
          },
        },
      },
    )

    try {
      let currentUser, userMetadata

      // The project getCurrentUser may change the shape of currentUser vs the supabase.currentUser
      // Therefore, if getCurrentUser is provided, use the authDecoder
      // then with the decoded token or cookie, get the current user
      // if (getCurrentUser) {
      // currentUser = await getCurrentUser(...)
      // userMetadata = currentUser?.user_metadata
      // }
      // but, if getCurrentUser is not provided, use the supabase server client to authenticate
      if (!getCurrentUser) {
        const { data, error } = await supabase.auth.getUser()
        if (!error) {
          currentUser = data.user
          userMetadata = currentUser?.user_metadata
        }
      }

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
