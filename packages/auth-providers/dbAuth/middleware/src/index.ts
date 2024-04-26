import type { APIGatewayProxyEvent, Context } from 'aws-lambda'

import type { DbAuthResponse } from '@redwoodjs/auth-dbauth-api'
import {
  cookieName as cookieNameCreator,
  dbAuthSession,
} from '@redwoodjs/auth-dbauth-api'
import type { GetCurrentUser } from '@redwoodjs/graphql-server'
import type { MiddlewareRequest } from '@redwoodjs/vite/middleware'
import { MiddlewareResponse } from '@redwoodjs/vite/middleware'

export interface DbAuthMiddlewareOptions {
  cookieName: string
  dbAuthUrl?: string
  // @NOTE: we never pass lambda event or contexts, when using middleware
  // this is because in existing projects have it typed api/src/functions/auth.ts
  dbAuthHandler: (
    req: Request | APIGatewayProxyEvent,
    context?: Context,
  ) => DbAuthResponse
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
    try {
      // Call the dbAuth auth decoder. For dbAuth we have direct access to the `dbAuthSession` function.
      // Other providers may be slightly different.
      const decryptedSession = dbAuthSession(req as Request, cookieName)

      const currentUser = await getCurrentUser(
        decryptedSession,
        {
          type: 'dbAuth',
          schema: 'cookie',
          // @MARK: We pass the entire cookie header as a token. This isn't actually the token!
          token: cookieHeader,
        },
        {
          // MWRequest is a superset of Request
          event: req as Request,
        },
      )

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
      console.error(e, 'Error decrypting dbAuth cookie')
      req.serverAuthContext.set(null)

      // Note we have to use ".unset" and not ".clear"
      // because we want to remove these cookies from the browser
      res.cookies.unset(cookieNameCreator(cookieName))
      res.cookies.unset('auth-provider')
    }

    return res
  }
}
