import { AuthenticationError } from 'apollo-server-lambda'
import { verifyAuth0Token } from 'src/auth/verifyAuth0Token'
import { getAuthorization } from 'src/auth/authHeaders'

import type { AuthDecoder } from './'
export type AuthDecoderAuth0 = AuthDecoder

export const decode = async ({
  event,
}: {
  event: APIGatewayProxyEvent
}): Promise<AuthToken> => {
  try {
    const authorization = getAuthorization(event)
    const decoded = await verifyAuth0Token(authorization.token)

    return decoded
  } catch {
    throw new AuthenticationError(
      'The authentication token could not be decoded.'
    )
  }
}

export const auth0 = (): AuthDecoderAuth0 => {
  return {
    type: 'auth0',
    decodeToken: async ({ event }) => {
      return decode({ event })
    },
  }
}
