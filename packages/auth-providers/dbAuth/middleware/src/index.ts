import type { APIGatewayProxyEvent, Context } from 'aws-lambda'

import type { DbAuthResponse } from '@redwoodjs/auth-dbauth-api'
import {
  cookieName as cookieNameCreator,
  dbAuthSession,
} from '@redwoodjs/auth-dbauth-api'
import type { GetCurrentUser } from '@redwoodjs/graphql-server'
import type { Middleware, MiddlewareRequest } from '@redwoodjs/vite/middleware'
import { MiddlewareResponse } from '@redwoodjs/vite/middleware'

export interface DbAuthMiddlewareOptions {
  cookieName?: string
  dbAuthUrl?: string
  // @NOTE: we never pass lambda event or contexts, when using middleware
  // this is because in existing projects have it typed api/src/functions/auth.ts
  dbAuthHandler: (
    req: Request | APIGatewayProxyEvent,
    context?: Context,
  ) => DbAuthResponse
  getRoles?: (decoded: any) => string[]
  getCurrentUser: GetCurrentUser
}

export const initDbAuthMiddleware = ({
  dbAuthHandler,
  getCurrentUser,
  getRoles,
  cookieName,
  dbAuthUrl = '/middleware/dbauth',
}: DbAuthMiddlewareOptions): [Middleware, '*'] => {
  const mw: Middleware = async (req, res = MiddlewareResponse.next()) => {
    // Handoff POST and some GET requests to the dbAuthHandler. The url is configurable on the dbAuth client side.
    // This is where we handle login, logout, and signup, etc., no need to enrich the context
    if (req.url.includes(dbAuthUrl)) {
      // Short circuit here ...
      // if the call came from packages/auth-providers/dbAuth/web/src/getCurrentUserFromMiddleware.ts
      if (req.url.includes(`${dbAuthUrl}/currentUser`)) {
        const { currentUser } = await validateSession({
          req,
          cookieName,
          getCurrentUser,
        })

        return new MiddlewareResponse(JSON.stringify({ currentUser }))
      } else {
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
    }

    const cookieHeader = req.headers.get('Cookie')

    if (!cookieHeader) {
      // Let the AuthContext fallback to its default value
      return res
    }

    // 👇 Authenticated request
    try {
      // Call the dbAuth auth decoder. For dbAuth we have direct access to the `dbAuthSession` function.
      // Other providers will be slightly different.
      const { currentUser, decryptedSession } = await validateSession({
        req,
        cookieName,
        getCurrentUser,
      })

      req.serverAuthState.set({
        currentUser,
        loading: false,
        isAuthenticated: !!currentUser,
        hasError: false,
        userMetadata: currentUser, // dbAuth doesn't have userMetadata
        cookieHeader,
        roles: getRoles ? getRoles(decryptedSession) : [],
      })
    } catch (e) {
      // Clear server auth context
      console.error('Error decrypting dbAuth cookie \n', e)
      req.serverAuthState.clear()

      // Note we have to use ".unset" and not ".clear"
      // because we want to remove these cookies from the browser
      res.cookies.unset(cookieNameCreator(cookieName))
      res.cookies.unset('auth-provider')
    }

    return res
  }

  // Return a tuple and wildcard route pattern
  // Just to make it more difficult for user to accidentally misconfigure
  return [mw, '*']
}

interface ValidateParams {
  req: MiddlewareRequest
  getCurrentUser: GetCurrentUser
  cookieName?: string
}

async function validateSession({
  req,
  cookieName,
  getCurrentUser,
}: ValidateParams) {
  const decryptedSession = dbAuthSession(
    req as Request,
    cookieNameCreator(cookieName),
  )

  // So that it goes into the catch block
  if (!decryptedSession) {
    throw new Error(
      `No decrypted session found. Check passed in cookie name options to middleware, looking for "${cookieName}"`,
    )
  }

  const currentUser = await getCurrentUser(
    decryptedSession,
    {
      type: 'dbAuth',
      schema: 'cookie',
      // @MARK: We pass the entire cookie header as a token. This isn't actually the token!
      // At this point the Cookie header is guaranteed, because otherwise a decryptionError would be thrown
      token: req.headers.get('Cookie') as string,
    },
    {
      // MWRequest is a superset of Request
      event: req as Request,
    },
  )
  return { currentUser, decryptedSession }
}

export default initDbAuthMiddleware
