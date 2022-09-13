import type { APIGatewayProxyEvent } from 'aws-lambda'

import { dbAuthSession } from './shared'

export const authDecoder = (
  authHeaderValue: string,
  req: { event: APIGatewayProxyEvent }
) => {
  const session = dbAuthSession(req.event)
  const authHeaderUserId = authHeaderValue

  if (session.id.toString() !== authHeaderUserId) {
    throw new Error('Authorization header does not match decrypted user ID')
  }

  return session
}
