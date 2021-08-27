import type { APIGatewayProxyEvent, Context as LambdaContext } from 'aws-lambda'

interface GlobalContext extends Record<string, unknown> {}

interface Req {
  event: APIGatewayProxyEvent
  context: GlobalContext & LambdaContext
}

export const clerk = async (token: string, req: Req) => {
  // Use require here, to prevent needing clerk sdk in api deps
  const { sessions, users } = require('@clerk/clerk-sdk-node')

  if (!process.env.CLERK_API_KEY) {
    console.error('CLERK_API_KEY env var is not set.')
    throw new Error('CLERK_API_KEY env var is not set.')
  }

  // Clerk sessions are a combination of a clerk "current session id", which we store
  // in the Redwood auth token, and the __session cookie, which contains a second session
  // bearer token. The two tokens together define which device is browsing and as who.
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
}
