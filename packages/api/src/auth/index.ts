export * from './parseJWT'

import type { APIGatewayProxyEvent, Context as LambdaContext } from 'aws-lambda'

import { getEventHeader } from '../event'

import type { Decoded } from './parseJWT'
export type { Decoded }

// This is shared by `@redwoodjs/web`
const AUTH_PROVIDER_HEADER = 'auth-provider'

export const getAuthProviderHeader = (
  event: APIGatewayProxyEvent | Request,
) => {
  const authProviderKey = Object.keys(event?.headers ?? {}).find(
    (key) => key.toLowerCase() === AUTH_PROVIDER_HEADER,
  )
  if (authProviderKey) {
    return getEventHeader(event, authProviderKey)
  }
  return undefined
}

export interface AuthorizationHeader {
  schema: 'Bearer' | 'Basic' | string
  token: string
}

/**
 * Split the `Authorization` header into a schema and token part.
 */
export const parseAuthorizationHeader = (
  event: APIGatewayProxyEvent | Request,
): AuthorizationHeader => {
  const parts = getEventHeader(event, 'Authorization')?.split(' ')
  if (parts?.length !== 2) {
    throw new Error('The `Authorization` header is not valid.')
  }
  const [schema, token] = parts
  if (!schema.length || !token.length) {
    throw new Error('The `Authorization` header is not valid.')
  }
  return { schema, token }
}

/** @MARK Note that we do not send LambdaContext when making fetch requests
 *
 * This part is incomplete, as we need to decide how we will make the breaking change to
 * 1. getCurrentUser
 * 2. authDecoders

 */

export type AuthContextPayload = [
  Decoded,
  { type: string } & AuthorizationHeader,
  // @MARK: Context is not passed when using middleware auth
  { event: APIGatewayProxyEvent | Request; context?: LambdaContext },
]

export type Decoder = (
  token: string,
  type: string,
  req: { event: APIGatewayProxyEvent | Request; context: LambdaContext },
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
  authDecoder?: Decoder | Decoder[]
  event: APIGatewayProxyEvent | Request
  context: LambdaContext
}): Promise<undefined | AuthContextPayload> => {
  const type = getAuthProviderHeader(event)

  // No `auth-provider` header means that the user is logged out,
  // and none of this auth malarky is required.
  if (!type) {
    return undefined
  }

  const { schema, token } = parseAuthorizationHeader(event)

  let authDecoders: Array<Decoder> = []

  if (Array.isArray(authDecoder)) {
    authDecoders = authDecoder
  } else if (authDecoder) {
    authDecoders = [authDecoder]
  }

  let decoded = null

  let i = 0
  while (!decoded && i < authDecoders.length) {
    decoded = await authDecoders[i](token, type, {
      // @TODO: We will need to make a breaking change to support `Request` objects.
      // We can remove this typecast
      event: event,
      context,
    })
    i++
  }

  return [decoded, { type, schema, token }, { event, context }]
}
