import {
  decryptSession,
  getSession,
  cookieName as cookieNameCreator,
} from '@redwoodjs/auth-dbauth-api'
import type { MiddlewareRequest } from '@redwoodjs/vite/middleware'
import { MiddlewareResponse } from '@redwoodjs/vite/middleware'

export interface DbAuthMiddlewareOptions {
  cookieName: string
  dbAuthHandler: (req: MiddlewareRequest) => Promise<typeof MiddlewareResponse> // this isn't right
  getCurrentUser: any
}

export const createDbAuthMiddleware = ({
  cookieName,
  dbAuthHandler,
  getCurrentUser,
}: DbAuthMiddlewareOptions) => {
  return async (req: MiddlewareRequest) => {
    const res = MiddlewareResponse.next()

    // If it's a POST request, handoff the request to the dbAuthHandler
    // But.... we still need to convert tha Lambda style headers (because of multiValueHeaders)
    // Note: The check of the POST method is for login, logout and signup
    // Question: Should we check for the those specific middleware auth requests
    // or any and every POST request? -- for Server Actions aka mutations
    if (req.method === 'POST') {
      // output is any, should this be a proper type from the dbAuthHandler that knows
      // about the multiValueHeaders and headers?
      const output = await dbAuthHandler(req)

      const finalHeaders = new Headers()
      Object.entries(output.headers).forEach(([key, value]) => {
        finalHeaders.append(key, String(value)) // hack cast to string
      })

      Object.entries(output.multiValueHeaders).forEach(([key, values]) => {
        const mvhValues = values as string[] // hack cast as string[]
        mvhValues.forEach((value) => finalHeaders.append(key, value))
      })

      // Don't we need to get and verify the cookie here?
      // or do we want to allow login, logout and signup not not need the cookie and thus
      // only check these endpoints in line 30?

      return new MiddlewareResponse(output.body, {
        headers: finalHeaders,
        status: output.statusCode,
      })
    }

    const cookieHeader = req.headers.get('Cookie')

    if (!cookieHeader) {
      // Let the AuthContext fallback to its default value
      return res
    }

    const session = getSession(cookieHeader, cookieNameCreator(cookieName))

    try {
      const [decryptedSession] = decryptSession(session)

      const currentUser = await getCurrentUser(decryptedSession)

      // Short circuit here ...
      // if the call came from packages/auth-providers/dbAuth/web/src/getCurrentUserFromMiddleware.ts
      if (req.url.includes('currentUser')) {
        return new MiddlewareResponse(JSON.stringify({ currentUser }))
      }

      req.serverAuthContext.set({
        currentUser,
        loading: false,
        isAuthenticated: !!currentUser,
        hasError: false,
        userMetadata: currentUser, // Not sure!
        cookieHeader,
      })
    } catch (e) {
      // Clear server auth context
      req.serverAuthContext.set(null)

      // @TODO(Rob): Clear the cookie
      // We currently do not expose a way of removing cookies in dbAuth
    }

    return res
  }
}
