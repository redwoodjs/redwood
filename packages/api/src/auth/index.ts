export * from './parseJWT'

import type { APIGatewayProxyEvent, Context as LambdaContext } from 'aws-lambda'

import type { Decoded } from './parseJWT'
export type { Decoded }

// This is shared by `@redwoodjs/web`
const AUTH_PROVIDER_HEADER = 'auth-provider'

export const getAuthProviderHeader = (event: APIGatewayProxyEvent) => {
  const authProviderKey = Object.keys(event?.headers ?? {}).find(
    (key) => key.toLowerCase() === AUTH_PROVIDER_HEADER
  )
  if (authProviderKey) {
    return event?.headers[authProviderKey]
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
  event: APIGatewayProxyEvent
): AuthorizationHeader => {
  console.log(`👉 \n ~ file: index.ts:33 ~ event.headers:`, event.headers)
  if (event.headers.cookie) {
    return {
      schema: 'cookie',
      token: event.headers.cookie,
    }
  }
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
  { type: string | null } & AuthorizationHeader,
  { event: APIGatewayProxyEvent; context: LambdaContext }
]

export type Decoder = (
  token: string,
  type: string | null,
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
  authDecoder?: Decoder | Decoder[]
  event: APIGatewayProxyEvent
  context: LambdaContext
}): Promise<undefined | AuthContextPayload> => {
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
    decoded = await authDecoders[i](token, null, { event, context })
    i++
  }

  return [decoded, { type: null, schema, token }, { event, context }]
}
