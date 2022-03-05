import type { APIGatewayProxyEvent } from 'aws-lambda'
import { Headers } from 'node-fetch'

// This is the same interface used by graphql-helix
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
