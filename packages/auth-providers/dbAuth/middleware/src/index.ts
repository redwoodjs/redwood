import {
  decryptSession,
  getSession,
  cookieName as cookieNameCreator,
} from '@redwoodjs/auth-dbauth-api'
import type { DbAuthResponse } from '@redwoodjs/auth-dbauth-api'
import type { GetCurrentUser } from '@redwoodjs/graphql-server'
import type { MiddlewareRequest } from '@redwoodjs/vite/middleware'
import { MiddlewareResponse } from '@redwoodjs/vite/middleware'
export interface DbAuthMiddlewareOptions {
  cookieName: string
  dbAuthUrl?: string
  dbAuthHandler: (req: Request) => DbAuthResponse
  getCurrentUser: GetCurrentUser
}

export const createDbAuthMiddleware = ({
  cookieName,
  dbAuthHandler,
  getCurrentUser,
  dbAuthUrl = '/middleware/dbauth',
}: DbAuthMiddlewareOptions) => {
  return async (req: MiddlewareRequest) => {
    const res = MiddlewareResponse.next()

    // Handoff POST requests to the dbAuthHandler. The url is configurable on the dbAuth client side.
    // This is where we handle login, logout, and signup, etc., but we don't want to intercept
    if (req.method === 'POST') {
      if (!req.url.includes(dbAuthUrl)) {
        // Bail if the POST request is not for the dbAuthHandler
        return res
      }

      const output = await dbAuthHandler(req)
      const finalHeaders = new Headers()

      Object.entries(output.headers).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          value.forEach((mvhHeader) => finalHeaders.append(key, mvhHeader))
        } else {
          finalHeaders.append(key, value)
        }
      })

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

    // 👇 Authenticated request
    const session = getSession(cookieHeader, cookieNameCreator(cookieName))

    try {
      const [decryptedSession] = decryptSession(session)

      const currentUser = await getCurrentUser(decryptedSession, req)

      // Short circuit here ...
      // if the call came from packages/auth-providers/dbAuth/web/src/getCurrentUserFromMiddleware.ts
      if (req.url.includes(`${dbAuthUrl}/currentUser`)) {
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

      // Clear the cookies, because decryption was invalid
      res.cookies.delete(cookieNameCreator(cookieName))
      res.cookies.delete('auth-provider')
    }

    return res
  }
}
