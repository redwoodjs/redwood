import { sessions, users } from '@clerk/clerk-sdk-node'
import type { APIGatewayProxyEvent, Context as LambdaContext } from 'aws-lambda'

import type { GlobalContext } from 'src/globalContext'

export type Req = {
  event: APIGatewayProxyEvent
  context: GlobalContext & LambdaContext
}

export const clerk = async (token: string, req: Req) => {
  if (!process.env.CLERK_API_KEY) {
    console.error('CLERK_API_KEY env var is not set.')
    throw new Error('CLERK_API_KEY env var is not set.')
  }

  try {
    const clerkCookieName = '__session'
    const cookies = req.event.headers['cookie']?.split(';').map((c) => c.trim())
    const sessionCookie = cookies
      ?.find((c) => c.startsWith(clerkCookieName + '='))
      ?.substring(clerkCookieName.length + 1)

    if (!sessionCookie || sessionCookie.length < 1) {
      return Promise.reject(new Error('Clerk __session token is not set'))
    }

    const session = await sessions.verifySession(token, sessionCookie)
    if (!session.userId) {
      return Promise.reject(new Error('Session invalid'))
    }

    const user = await users.getUser(session.userId)

    return {
      ...user,
      roles: user.publicMetadata['roles'] ?? [],
    }
  } catch (error) {
    return Promise.reject(error)
  }
}
