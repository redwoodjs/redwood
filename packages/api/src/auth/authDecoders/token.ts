import { AuthenticationError } from 'apollo-server-lambda'
import { getAuthorization } from 'src/auth/authHeaders'

import type { AuthDecoder } from './'
export type AuthDecoderToken = AuthDecoder

export const decode = async ({
  event,
}: {
  event: APIGatewayProxyEvent
  context: LambdaContext
}): Promise<AuthToken> => {
  try {
    let decoded: AuthToken = null
    const authorization = getAuthorization(event)
    decoded = authorization['token']

    return decoded
  } catch {
    throw new AuthenticationError(
      'The authentication token could not be decoded.'
    )
  }
}

export const token = (): AuthDecoderToken => {
  return {
    type: 'token',
    decodeToken: async ({ event }) => {
      return decode({ event })
    },
  }
}
