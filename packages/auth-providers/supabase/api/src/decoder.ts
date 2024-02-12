import { createServerClient } from '@supabase/ssr'
import cookie from 'cookie'

import type { Decoded, Decoder } from '@redwoodjs/api'

// MARK!
// Breaking change to supabase auth decoder
export const authDecoder: Decoder = async (
  cookieString: string,
  type: string
) => {
  if (type !== 'supabase') {
    return null
  }

  if (!process.env.SUPABASE_JWT_SECRET) {
    console.error('SUPABASE_JWT_SECRET env var is not set.')
    throw new Error('SUPABASE_JWT_SECRET env var is not set.')
  }

  try {
    const parsedCookie = cookie.parse(cookieString)

    const supabase = createServerClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_KEY!,
      {
        cookies: {
          get(key: string) {
            return parsedCookie[key]
          },
        },
      }
    )

    const user = await supabase.auth.getUser()

    return user.data.user as Decoded
  } catch (error) {
    return Promise.reject(error)
  }
}
