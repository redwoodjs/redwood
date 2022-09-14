import jwt from 'jsonwebtoken'

import { Decoder } from '@redwoodjs/api'

export const authDecoder: Decoder = async (token: string, type: string) => {
  if (type !== 'ethereum') {
    return null
  }

  if (!process.env.ETHEREUM_JWT_SECRET) {
    console.error('ETHEREUM_JWT_SECRET env var is not set.')
    throw new Error('ETHEREUM_JWT_SECRET env var is not set.')
  }

  try {
    const secret = process.env.ETHEREUM_JWT_SECRET as string
    return Promise.resolve(jwt.verify(token, secret) as Record<string, unknown>)
  } catch (error) {
    return Promise.reject(error)
  }
}
