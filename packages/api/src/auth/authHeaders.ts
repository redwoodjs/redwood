import type { APIGatewayProxyEvent, Context as LambdaContext } from 'aws-lambda'
import type { SupportedAuthTypes } from '@redwoodjs/auth'

import type { AuthToken } from './authDecoders'
import { createAuthDecoder } from './authDecoders'

// This is shared by `@redwoodjs/web`
const AUTH_PROVIDER_HEADER = 'auth-provider'

export const getAuthProviderType = (
  event: APIGatewayProxyEvent
): SupportedAuthTypes => {
  return event?.headers[AUTH_PROVIDER_HEADER] as SupportedAuthTypes
}

export interface AuthorizationHeader {
  schema: 'Bearer' | 'Basic'
  token: string
}

/**
 * This function returns the Authorization Header Schema and Token
 * from the client request event headers in AuthorizationHeader
 * to be decoded or otherwise used in token-based authentication
 * when required to allow an application to access an API.
 *
 * @returns AuthorizationHeader
 */
export const getAuthorization = (event: {
  event: APIGatewayProxyEvent
}): AuthorizationHeader => {
  try {
    const authorizationHeader: AuthorizationHeader = {
      schema: null,
      token: null,
    }
    const mechanism = event.headers?.authorization?.split(' ')
    authorizationHeader.schema = mechanism?.[0]
    authorizationHeader.token = mechanism?.[1]

    if (!mechanism.length === 2 || authorizationHeader.token.length === 0) {
      throw new Error('Empty authorization token')
    }

    return authorizationHeader
  } catch {
    throw new Error('Error getting Authorization header')
  }
}

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
  const authDecoder = createAuthDecoder(type)
  const decoded = await authDecoder.decodeToken({ type, event, context })

  return decoded
}
