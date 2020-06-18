import type {
  APIGatewayProxyEvent,
  Context as LambdaContext,
  ClientContext,
} from 'aws-lambda'
import type { SupportedAuthTypes } from '@redwoodjs/auth'
//
import jwt from 'jsonwebtoken'
import { AuthenticationError } from 'apollo-server-lambda'

import { verifyAuth0Token } from './verifyAuth0Token'

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

export type AuthToken = null | object | string

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
}): Promise<AuthToken> => {
  const token = event.headers?.authorization?.split(' ')?.[1]
  if (!token && token.length === 0) {
    throw new Error('Empty authorization token')
  }

  let decoded: AuthToken = null
  switch (type) {
    case 'goTrue':
    case 'netlify': {
      // Netlify verifies and decodes a JWT before the request hits the Serverless
      // function so the decoded jwt is already available in production
      if (process.env.NODE_ENV === 'production') {
        const clientContext = context.clientContext as NewClientContext
        decoded = clientContext?.user || null
      } else {
        // We emualate the native Netlify experience in development mode.
        // We just decode it since we don't have the signing key.
        decoded = jwt.decode(token)
      }
      break
    }
    case 'auth0': {
      decoded = await verifyAuth0Token(token)
      break
    }
    // These tokens require a 3rd party library for decoding that we don't want to
    // bundle with each installation. We'll cover it in the documentation.
    case 'custom':
    case 'firebase':
    case 'magicLink': {
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
