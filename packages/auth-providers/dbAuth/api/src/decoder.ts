import type { APIGatewayProxyEvent } from 'aws-lambda'

import { Decoder } from '@redwoodjs/api'

import { dbAuthSession } from './shared'

export const authDecoder: Decoder = async (
  authHeaderValue: string,
  type: string,
  req: { event: APIGatewayProxyEvent }
) => {
  if (type !== 'dbAuth') {
    return null
  }

  const session = dbAuthSession(req.event)
  const authHeaderUserId = authHeaderValue

  if (session.id.toString() !== authHeaderUserId) {
    throw new Error('Authorization header does not match decrypted user ID')
  }

  return session
}
