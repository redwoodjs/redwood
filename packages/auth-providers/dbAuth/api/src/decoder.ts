import type { APIGatewayProxyEvent } from 'aws-lambda'

import type { Decoder } from '@redwoodjs/api'

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
    console.error('Authorization header does not match decrypted user ID')
    throw new Error('Authorization header does not match decrypted user ID')
  }

  return session
}
