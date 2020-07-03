import type {
  APIGatewayProxyEvent,
  Context as LambdaContext,
  ClientContext,
} from 'aws-lambda'
import { AuthenticationError } from 'apollo-server-lambda'
import jwt from 'jsonwebtoken'
import { getAuthorization } from 'src/auth/authHeaders'

import type { AuthDecoder } from './'
export type AuthDecoderNetlify = AuthDecoder

type NewClientContext = ClientContext & {
  user?: object
}

export const decode = async ({
  event,
  context,
}: {
  event: APIGatewayProxyEvent
  context: LambdaContext
}): Promise<AuthToken> => {
  try {
    let decoded: AuthToken = null

    // Netlify verifies and decodes a JWT before the request hits the Serverless
    // function so the decoded JWT is already available in production
    if (process.env.NODE_ENV === 'production') {
      const clientContext = context.clientContext as NewClientContext
      decoded = clientContext?.user || null
    } else {
      // We emulate the native Netlify experience in development mode.
      // We just decode it since we don't have the signing key.
      const authorization = getAuthorization(event)
      const token = authorization['token']
      decoded = jwt.decode(token)
    }

    return decoded
  } catch {
    throw new AuthenticationError(
      'The authentication token could not be decoded.'
    )
  }
}

export const netlify = (): AuthDecoderNetlify => {
  return {
    type: 'netlify',
    decodeToken: async ({ event, context }) => {
      return decode({ event, context })
    },
  }
}
