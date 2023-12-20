export * from './parseJWT'

import type { APIGatewayProxyEvent, Context as LambdaContext } from 'aws-lambda'
// @ts-expect-error Types are incorrect in 0.6, but will be fixed in the next version probably
import { parse as parseCookie } from 'cookie'

import { isFetchApiRequest } from '../transforms'

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

export const parseAuthorizationCookie = (
  event: APIGatewayProxyEvent | Request
) => {
  const cookie = isFetchApiRequest(event)
    ? event.headers.get('Cookie')
    : event.headers?.Cookie || event.headers.cookie

  // Unauthenticated request
  if (!cookie) {
    return null
  }

  const parsedCookie = parseCookie(cookie)

  return {
    parsedCookie,
    rawCookie: cookie,
    type: parsedCookie.authProvider,
  }
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
  authDecoder?: Decoder | Decoder[]
  event: APIGatewayProxyEvent
  context: LambdaContext
}): Promise<undefined | AuthContextPayload> => {
  const typeFromHeader = getAuthProviderHeader(event)
  const cookieHeader = parseAuthorizationCookie(event)

  // Shortcircuit - if no auth-provider or cookie header, its
  // an unauthenticated request
  if (!typeFromHeader && !cookieHeader) {
    return undefined
  }

  let token: string | undefined
  let type: string | undefined
  let schema: string | undefined

  // If type is set in the header, use Bearer token auth
  if (typeFromHeader) {
    const parsedAuthHeader = parseAuthorizationHeader(event)
    token = parsedAuthHeader.token
    type = typeFromHeader
    schema = parsedAuthHeader.schema
  } else if (cookieHeader) {
    // The actual session parsing is done by the auth decoder
    token = cookieHeader.rawCookie
    type = cookieHeader.type
    schema = 'cookie'
  }

  // Unauthenticatd request
  if (!token || !type || !schema) {
    return undefined
  }

  // Run through decoders until one returns a decoded payload
  let authDecoders: Array<Decoder> = []

  if (Array.isArray(authDecoder)) {
    authDecoders = authDecoder
  } else if (authDecoder) {
    authDecoders = [authDecoder]
  }

  let decoded = null

  let i = 0
  while (!decoded && i < authDecoders.length) {
    decoded = await authDecoders[i](token, type, { event, context })
    i++
  }

  return [decoded, { type, schema, token }, { event, context }]
}
