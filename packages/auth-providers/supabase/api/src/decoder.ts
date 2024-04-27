import { createServerClient, type CookieOptions } from '@supabase/ssr'
import jwt from 'jsonwebtoken'

import type { Decoded, Decoder } from '@redwoodjs/api'
import type { MiddlewareRequest } from '@redwoodjs/vite/middleware'
/**
 * Decodes a Supabase JWT with Bearer token or
 * uses createServerClient verify an authenticated cookie header request
 *
 * Note: the event is as Middleware Request for cookie-based middleware auth
 */
export const authDecoder: Decoder = async (
  token: string,
  type: string,
  { event },
) => {
  if (type !== 'supabase') {
    return null
  }

  // TODO: Check if streaming is setup, not if type is set
  if (type) {
    const req = event as MiddlewareRequest
    const supabase = createServerClient(
      process.env.SUPABASE_URL || '',
      process.env.SUPABASE_KEY || '',
      {
        cookies: {
          get(name: string) {
            return req.cookies.get(name)?.valueOf() || ''
          },
          set(name: string, value: string, options: CookieOptions) {
            req.cookies.set(name, value, options)
          },
          remove(name: string, _options: CookieOptions) {
            req.cookies.unset(name)
            req.cookies.unset('auth-provider')
          },
        },
      },
    )

    const { data, error } = await supabase.auth.getSession()

    if (!error) {
      const { session } = data
      if (session) {
        const token = await session.access_token
        return JSON.parse(token) as Decoded
      }
      throw new Error('No Supabase session found')
    } else {
      console.error(error)
      throw new Error(error.message)
    }
  } else {
    if (!process.env.SUPABASE_JWT_SECRET) {
      console.error('SUPABASE_JWT_SECRET env var is not set.')
      throw new Error('SUPABASE_JWT_SECRET env var is not set.')
    }

    try {
      const secret = process.env.SUPABASE_JWT_SECRET as string
      return Promise.resolve(
        jwt.verify(token, secret) as Record<string, unknown>,
      )
    } catch (error) {
      return Promise.reject(error)
    }
  }
}
