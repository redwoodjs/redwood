import type { APIGatewayProxyEvent } from 'aws-lambda'

export type AccessToken = null | string

/**
 * This function returns the Authorization Token from the client request event headers
 * to be decoded by decodeAuthToken() or otherwise used in token-based authentication
 * when required to allow an application to access an API; hence: "Access Token".
 *
 * @returns `null` when the authorization token wasn't available in the event headers.
 * @returns `string` otherwise.
 */
export const accessToken = async (event: {
  event: APIGatewayProxyEvent
}): Promise<AccessToken> => {
  let accessToken: AccessToken = null
  accessToken = event.headers?.authorization?.split(' ')?.[1]

  if (!accessToken && accessToken.length === 0) {
    throw new Error('Empty authorization token')
  }

  return accessToken
}
