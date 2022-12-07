import { Decoder } from '@redwoodjs/api'

export const authDecoder: Decoder = async (token: string, type: string) => {
  if (type !== 'clerk') {
    return null
  }

  if (!process.env.CLERK_JWT_KEY) {
    console.error('CLERK_JWT_KEY env var is not set.')
    throw new Error('CLERK_JWT_KEY env var is not set.')
  }

  const { users, default: clerk } = await import('@clerk/clerk-sdk-node')

  try {
    const jwtPayload = await clerk.base.verifySessionToken(token)

    if (!jwtPayload.sub) {
      return Promise.reject(new Error('Session invalid'))
    }

    const user = await users.getUser(jwtPayload.sub)

    return {
      ...user,
      roles: user.publicMetadata['roles'] ?? [],
    }
  } catch (error) {
    console.error(error)
    return Promise.reject(error)
  }
}
