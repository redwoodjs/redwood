import type { APIGatewayProxyEvent } from 'aws-lambda'
import { Headers } from 'cross-undici-fetch'

// This is the same interface used by GraphQL Yoga
// But not importing here to avoid adding a dependency
export interface Request {
  body?: any
  headers: Headers
  method: string
  query: any
}

/**
 * Extracts and parses body payload from event with base64 encoding check
 */
export const parseEventBody = (event: APIGatewayProxyEvent) => {
  if (!event.body) {
    return
  }

  if (event.isBase64Encoded) {
    return JSON.parse(Buffer.from(event.body, 'base64').toString('utf-8'))
  } else {
    return JSON.parse(event.body)
  }
}

export function normalizeRequest(event: APIGatewayProxyEvent): Request {
  const body = parseEventBody(event)

  return {
    headers: new Headers(event.headers as Record<string, string>),
    method: event.httpMethod,
    query: event.queryStringParameters,
    body,
  }
}

// Internal note:  Equivalent to dnull package on npm, which seems to have import issues in latest versions

/**
 * Useful for removing nulls from an object, such as an input from a GraphQL mutation used directly in a Prisma query
 * @param obj - Object to remove nulls from
 * See {@link https://www.prisma.io/docs/concepts/components/prisma-client/null-and-undefined Prisma docs: null vs undefined}
 */
export const removeNulls = (obj: Record<number | symbol | string, any>) => {
  for (const key in obj) {
    if (obj[key] === null) {
      obj[key] = undefined
    }
  }

  return obj
}
