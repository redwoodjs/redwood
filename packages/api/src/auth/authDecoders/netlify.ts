import { AuthenticationError } from 'apollo-server-lambda'
import jwt from 'jsonwebtoken'
import { accessToken } from 'src/auth/accessToken'

import type { AuthDecoder } from './'
export type AuthDecoderNetlify = AuthDecoder

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
      const token = await accessToken(event)
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
