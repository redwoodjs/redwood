import type {
  APIGatewayProxyEvent,
  Context as LambdaContext,
  ClientContext,
} from 'aws-lambda'
//
import jwt from 'jsonwebtoken'

import { verifyAuth0Token } from './verifyAuth0Token'

export type SupportedAuthTypes = 'auth0' | 'netlify' | 'gotrue'

// This is shared by `@redwoodjs/web`
const AUTH_PROVIDER_HEADER = 'Auth-Provider'

type NewClientContext = ClientContext & {
  user?: object
}

export type AuthTokenType = null | object | string

/**
 * Redwood supports multiple authentication providers. We add headers to the client
 * requests when a user is authenticated
 * - `Auth-Provider`: Denotes the authentication provider.
 * - `Authorization`: A JWT or SWT token.
 *
 * This function decodes the Authorization token.
 */
export const decodeAuthToken = async ({
  event,
  context,
}: {
  event: APIGatewayProxyEvent
  context: LambdaContext
}): Promise<AuthTokenType> => {
  const type = event?.headers[AUTH_PROVIDER_HEADER] as SupportedAuthTypes
  if (!type) {
    return undefined
  }

  const isProduction = process.env.NODE_ENV === 'production'
  const token = event.headers?.authorization.split(' ')?.[1]

  if (!token && token.length === 0) {
    throw new Error('Your authorization token is empty.')
  }

  switch (type) {
    case 'gotrue':
    case 'netlify': {
      // Netlify verifies and decodes a JWT before the request hits the lambda
      // function handler, so the payload is already available.
      if (isProduction) {
        // TODO: Verify what happens in production if the jwt is invalid.
        const clientContext = context.clientContext as NewClientContext
        return clientContext?.user
      } else {
        // We emualate the native Netlify experience in development mode. We cannot
        // verify the jwt, since we don't have the access to the signing key.
        return jwt.decode(token)
      }
    }
    case 'auth0': {
      return await verifyAuth0Token(token)
    }
    default:
      throw new Error(`Auth-Provider of type "${type}" is not supported.`)
  }
}
