import jwt from 'jsonwebtoken'

export const ethereum = (token: string) => {
  if (process.env.NODE_ENV === 'production') {
    if (!process.env.JWT_SECRET) {
      throw new Error('`JWT_SECRET` env var is not set.')
    }

    try {
      const secret = process.env.JWT_SECRET as string
      return Promise.resolve(
        jwt.verify(token, secret) as Record<string, unknown>
      )
    } catch (error) {
      return Promise.reject(error)
    }
  } else {
    return Promise.resolve(jwt.decode(token))
  }
}
