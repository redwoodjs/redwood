import type IClerk from '@clerk/clerk-sdk-node/instance'

import { Decoder } from '@redwoodjs/api'

export const authDecoder: Decoder = async (token: string, type: string) => {
  if (type !== 'clerk') {
    return null
  }

  // Use require here, to prevent needing clerk sdk in api deps
  const Clerk = require('@clerk/clerk-sdk-node/instance').default

  const { users, base }: IClerk = new Clerk()

  if (!process.env.CLERK_JWT_KEY) {
    console.error('CLERK_JWT_KEY env var is not set.')
    throw new Error('CLERK_JWT_KEY env var is not set.')
  }

  try {
    const jwtPayload = await base.verifySessionToken(token)

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
