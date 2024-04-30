import { createServerClient } from '@supabase/ssr'
import type { CookieOptions } from '@supabase/ssr'

import { throwSupabaseSettingsError } from '@redwoodjs/auth-supabase-api'
import type {
  MiddlewareRequest,
  MiddlewareResponse,
} from '@redwoodjs/vite/middleware'

/**
 * Creates Supabase Server Client used to get the session cookie (only)
 * from a given collection of auth cookies
 */
const createSupabaseServerClient = (
  req: MiddlewareRequest,
  res: MiddlewareResponse,
) => {
  if (!process.env.SUPABASE_URL) {
    throwSupabaseSettingsError('SUPABASE_URL')
  }

  if (!process.env.SUPABASE_KEY) {
    throwSupabaseSettingsError('SUPABASE_KEY')
  }

  return createServerClient(
    process.env.SUPABASE_URL || '',
    process.env.SUPABASE_KEY || '',
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.valueOf()
        },
        set(name: string, value: string, options: CookieOptions) {
          req.cookies.set(name, value, options)
          res.cookies.set(name, value, options)
        },
        remove(name: string, options: CookieOptions) {
          req.cookies.set(name, '', options)
          res.cookies.set(name, '', options)
        },
      },
    },
  )
}

/**
 * Clear the Supabase and auth cookies from the request and response
 */
export const clearSupabaseCookies = (
  req: MiddlewareRequest,
  res: MiddlewareResponse,
) => {
  // clear supabase cookies
  const supabase = createSupabaseServerClient(req, res)
  supabase.auth.signOut()

  // Clear server auth context
  req.serverAuthContext.set(null)

  // clear auth-provider cookies
  req.cookies.unset('auth-provider')
  res.cookies.unset('auth-provider')
}
