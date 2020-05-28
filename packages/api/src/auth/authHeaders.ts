import type {
  APIGatewayProxyEvent,
  Context as LambdaContext,
  ClientContext,
} from 'aws-lambda'
//
import jwt from 'jsonwebtoken'
import { AuthenticationError } from 'apollo-server-lambda'

import { verifyAuth0Token } from './verifyAuth0Token'

export type SupportedAuthTypes = 'auth0' | 'netlify' | 'gotrue' | 'magic.link'

// This is shared by `@redwoodjs/web`
const AUTH_PROVIDER_HEADER = 'auth-provider'

export const getAuthProviderType = (
  event: APIGatewayProxyEvent
): SupportedAuthTypes => {
  return event?.headers[AUTH_PROVIDER_HEADER] as SupportedAuthTypes
}

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
 *
 * @returns `null` when the auth token couldn't be decoded or wasn't available.
 * @returns `object` or `string` otherwise.
 */
export const decodeAuthToken = async ({
  type,
  event,
  context,
}: {
  type: SupportedAuthTypes
  event: APIGatewayProxyEvent
  context: LambdaContext
}): Promise<AuthTokenType> => {
  const token = event.headers?.authorization?.split(' ')?.[1]
  if (!token && token.length === 0) {
    throw new Error('Empty authorization token')
  }

  let decoded: AuthTokenType = null
  switch (type) {
    case 'gotrue':
    case 'netlify': {
      // Netlify verifies and decodes a JWT before the request hits the lambda
      // function handler so the decoded jwt is already available.
      if (process.env.NODE_ENV === 'production') {
        const clientContext = context.clientContext as NewClientContext
        decoded = clientContext?.user || null
      } else {
        // We emualate the native Netlify experience in development mode.
        // We decode it since we don't have the signing key.
        decoded = jwt.decode(token)
      }
      break
    }
    case 'auth0': {
      decoded = await verifyAuth0Token(token)
      break
    }
    // The tokens here include a custom library for decoding. The user receives a "raw token" which they have to decode themselves.
    case 'magic.link': {
      decoded = token
      break
    }
    default:
      throw new Error(`Auth-Provider of type "${type}" is not supported.`)
  }

  if (decoded === null) {
    throw new AuthenticationError(
      'The authentication token could not be decoded.'
    )
  }

  return decoded
}
