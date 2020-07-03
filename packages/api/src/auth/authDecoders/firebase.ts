import { AuthenticationError } from 'apollo-server-lambda'
import { accessToken } from 'src/auth/accessToken'

import type { AuthDecoder } from './'
export type AuthDecoderFirebase = AuthDecoder

export const decode = async ({
  event,
}: {
  event: APIGatewayProxyEvent
  context: LambdaContext
}): Promise<AuthToken> => {
  try {
    let decoded: AuthToken = null
    decoded = await accessToken(event)

    return decoded
  } catch {
    throw new AuthenticationError(
      'The authentication token could not be decoded.'
    )
  }
}

export const firebase = (): AuthDecoderFirebase => {
  return {
    type: 'firebase',
    decodeToken: async ({ event }) => {
      return decode({ event })
    },
  }
}
