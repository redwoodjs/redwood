export * from './parseJWT'

import type { APIGatewayProxyEvent, Context as LambdaContext } from 'aws-lambda'

import type { Decoded } from './parseJWT'
export type { Decoded }

// This is shared by `@redwoodjs/web`
const AUTH_PROVIDER_HEADER = 'auth-provider'

export const getAuthProviderHeader = (event: APIGatewayProxyEvent) => {
  return event?.headers[AUTH_PROVIDER_HEADER]
}

export interface AuthorizationHeader {
  schema: 'Bearer' | 'Basic' | string
  token: string
}

/**
 * Split the `Authorization` header into a schema and token part.
 */
export const parseAuthorizationHeader = (
  event: APIGatewayProxyEvent
): AuthorizationHeader => {
  const parts = (
    event.headers?.authorization || event.headers?.Authorization
  )?.split(' ')
  if (parts?.length !== 2) {
    throw new Error('The `Authorization` header is not valid.')
  }
  const [schema, token] = parts
  if (!schema.length || !token.length) {
    throw new Error('The `Authorization` header is not valid.')
  }
  return { schema, token }
}

export type AuthContextPayload = [
  Decoded,
  { type: string } & AuthorizationHeader,
  { event: APIGatewayProxyEvent; context: LambdaContext }
]

export type Decoder = (
  token: string,
  type: string,
  req: { event: APIGatewayProxyEvent; context: LambdaContext }
) => Promise<Decoded>

/**
 * Get the authorization information from the request headers and request context.
 * @returns [decoded, { type, schema, token }, { event, context }]
 **/
export const getAuthenticationContext = async ({
  authDecoder,
  event,
  context,
}: {
  authDecoder?: Decoder
  event: APIGatewayProxyEvent
  context: LambdaContext
}): Promise<undefined | AuthContextPayload> => {
  const type = getAuthProviderHeader(event)

  // No `auth-provider` header means that the user is logged out,
  // and none of this auth malarky is required.
  if (!type || !authDecoder) {
    return undefined
  }

  const { schema, token } = parseAuthorizationHeader(event)
  const decoded = await authDecoder(token, type, { event, context })
  return [decoded, { type, schema, token }, { event, context }]
}
