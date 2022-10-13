export const clerk = async (token: string) => {
  // Use require here, to prevent needing clerk sdk in api deps
  const { users, base } = require('@clerk/clerk-sdk-node').default

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
    return Promise.reject(error)
  }
}
