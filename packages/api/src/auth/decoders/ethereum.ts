import jwt from 'jsonwebtoken'

export const ethereum = (token: string) => {
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
