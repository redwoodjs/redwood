import { createServerClient } from '@supabase/ssr'
import jwt from 'jsonwebtoken'

import {
  parseAuthorizationCookie,
  type Decoded,
  type Decoder,
} from '@redwoodjs/api'

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

  if (type !== 'supabase') {
    return null
  }

  const authCookies = parseAuthorizationCookie(event)

  // This tells the decoder that we're using server-auth
  // It comes from the auth-provider cookie
  if (authCookies?.type === 'supabase') {
    if (!process.env.SUPABASE_URL) {
      console.error('SUPABASE_URL env var is not set.')
      throw new Error('SUPABASE_URL env var is not set.')
    }

    if (!process.env.SUPABASE_KEY) {
      console.error('SUPABASE_KEY env var is not set.')
      throw new Error('SUPABASE_KEY env var is not set.')
    }
    const supabase = createServerClient(
      process.env.SUPABASE_URL || '',
      process.env.SUPABASE_KEY || '',
      {
        cookies: {
          get(name: string) {
            // We cannot directly access req.cookies in the decoder
            // Because graphql passes lambda event, while middleware passes a mwRequest
            return authCookies?.parsedCookie?.[name]
          },
        },
      },
    )

    const { data, error } = await supabase.auth.getSession()

    if (!error) {
      const { session } = data
      if (session) {
        const token = await session.access_token
        return (await jwt.verify(token, secret)) as Decoded
      }
      throw new Error('No Supabase session found')
    } else {
      console.error(error)
      throw error
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
