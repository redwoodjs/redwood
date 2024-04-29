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
  if (!process.env.SUPABASE_JWT_SECRET) {
    console.error('SUPABASE_JWT_SECRET env var is not set.')
    throw new Error('SUPABASE_JWT_SECRET env var is not set.')
  }
  const secret = process.env.SUPABASE_JWT_SECRET as string

  console.log('Supabase authDecoder', process.env)
  if (type !== 'supabase') {
    return null
  }

  // If SSR, then use the Supabase client to verify the cookie
  if (process.env.RWJS_EXP_STREAMING_SSR) {
    if (!process.env.SUPABASE_URL) {
      console.error('SUPABASE_URL env var is not set.')
      throw new Error('SUPABASE_URL env var is not set.')
    }

    if (!process.env.SUPABASE_KEY) {
      console.error('SUPABASE_KEY env var is not set.')
      throw new Error('SUPABASE_KEY env var is not set.')
    }
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

    console.log('Supabase authDecoder', token)

    const { data, error } = await supabase.auth.getSession()

    console.log('Supabase getSession', data, error)

    if (!error) {
      const { session } = data
      console.log('Supabase session', session)

      if (session) {
        const token = await session.access_token
        return (await jwt.verify(token, secret)) as Decoded
      }
      throw new Error('No Supabase session found')
    } else {
      console.error(error)
      throw new Error(error.message)
    }
  } else {
    // If not SSR, then use the JWT secret to verify the Bearer token
    try {
      return jwt.verify(token, secret) as Decoded
    } catch (error) {
      console.error(error)
      throw error
    }
  }
}
