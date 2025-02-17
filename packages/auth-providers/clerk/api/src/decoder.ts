import type { Decoder } from '@redwoodjs/api'

export const clerkAuthDecoder: Decoder = async (
  token: string,
  type: string,
) => {
  if (type !== 'clerk') {
    return null
  }

  const { verifyToken } = await import('@clerk/backend')

  try {
    const jwtPayload = await verifyToken(token, {
      jwtKey: process.env.CLERK_JWT_KEY,
      secretKey: process.env.CLERK_SECRET_KEY,
      apiUrl: process.env.CLERK_API_URL,
    })

    if (!jwtPayload.sub) {
      return Promise.reject(new Error('Session invalid'))
    }

    return {
      ...jwtPayload,
      id: jwtPayload.sub,
    }
  } catch (error) {
    console.error(error)
    return Promise.reject(error)
  }
}
