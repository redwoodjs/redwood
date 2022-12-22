import jwt from 'jsonwebtoken'

import { Decoder } from '@redwoodjs/api'

export const authDecoder: Decoder = async (token: string, type: string) => {
  if (type !== 'supabase') {
    return null
  }

  if (!process.env.SUPABASE_JWT_SECRET) {
    console.error('SUPABASE_JWT_SECRET env var is not set.')
    throw new Error('SUPABASE_JWT_SECRET env var is not set.')
  }

  try {
    const secret = process.env.SUPABASE_JWT_SECRET as string
    return Promise.resolve(jwt.verify(token, secret) as Record<string, unknown>)
  } catch (error) {
    return Promise.reject(error)
  }
}
