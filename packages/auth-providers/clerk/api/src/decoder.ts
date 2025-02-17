import type { Decoder } from '@redwoodjs/api'

/**
 * @deprecated This function will be removed; it uses a rate-limited API. Use `clerkAuthDecoder` instead.
 */
export const authDecoder: Decoder = async (token: string, type: string) => {
  if (type !== 'clerk') {
    return null
  }

  const { createClerkClient, verifyToken } = await import('@clerk/backend')

  const clerk = createClerkClient({
    jwtKey: process.env.CLERK_JWT_KEY,
  })

  try {
    const jwtPayload = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY,
    })

    if (!jwtPayload.sub) {
      return Promise.reject(new Error('Session invalid'))
    }

    const user = await clerk.users.getUser(jwtPayload.sub)

    return {
      ...user,
      roles: user.publicMetadata['roles'] ?? [],
    }
  } catch (error) {
    console.error(error)
    return Promise.reject(error)
  }
}

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
