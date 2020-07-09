import type { GlobalContext } from 'src/globalContext'
import type { APIGatewayProxyEvent, Context as LambdaContext } from 'aws-lambda'
import type { SupportedAuthTypes } from '@redwoodjs/auth'

import { decodeToken } from './decoders'

// This is shared by `@redwoodjs/web`
const AUTH_PROVIDER_HEADER = 'auth-provider'

export const getAuthProviderHeader = (
  event: APIGatewayProxyEvent
): SupportedAuthTypes => {
  return event?.headers[AUTH_PROVIDER_HEADER] as SupportedAuthTypes
}

export interface AuthorizationHeader {
  schema: 'Bearer' | 'Basic'
  token: string
}
/**
 * Split the `Authorization` header into a schema and token part.
 */
export const parseAuthorizationHeader = (
  event: APIGatewayProxyEvent
): AuthorizationHeader => {
  const [schema, token] = event.headers?.authorization?.split(' ')
  if (!schema.length || !token.length) {
    throw new Error('The `Authorization` header is not valid.')
  }
  // @ts-expect-error
  return { schema, token }
}

export type AuthContextPayload = [
  string | object | null,
  { type: SupportedAuthTypes; token: string }
]

/**
 * Get the authorization information from the request headers and request context.
 * @returns [decoded, { type, token }]
 **/
export const getAuthenticationContext = async ({
  event,
  context,
}: {
  event: APIGatewayProxyEvent
  context: GlobalContext & LambdaContext
}): Promise<undefined | AuthContextPayload> => {
  const type = getAuthProviderHeader(event)
  // No `auth-provider` header means that the user is logged out,
  // and none of this is auth malarky is required.
  if (!type) {
    return undefined
  }

  let decoded = null
  const { token } = parseAuthorizationHeader(event)
  decoded = await decodeToken(type, token, { event, context })
  return [decoded, { type, token }]
}
