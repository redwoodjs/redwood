import type { APIGatewayProxyEvent } from 'aws-lambda'

import type { Decoder } from '@redwoodjs/api'

import { dbAuthSession } from './shared'

export const createAuthDecoder = (cookieNameOption: string): Decoder => {
  return async (token, type, req) => {
    if (type !== 'dbAuth') {
      return null
    }

    const session = dbAuthSession(req.event, cookieNameOption)
    const authHeaderUserId = token

    if (session.id.toString() !== authHeaderUserId) {
      console.error('Authorization header does not match decrypted user ID')
      throw new Error('Authorization header does not match decrypted user ID')
    }

    return session
  }
}

/** @deprecated use `createAuthDecoder` */
export const authDecoder: Decoder = async (
  authHeaderValue: string,
  type: string,
  req: { event: APIGatewayProxyEvent }
) => {
  if (type !== 'dbAuth') {
    return null
  }

  // Passing `undefined` as the second argument to `dbAuthSession` will make
  // it fall back to the default cookie name `session`, making it backwards
  // compatible with existing RW apps.
  const session = dbAuthSession(req.event, undefined)
  const authHeaderUserId = authHeaderValue

  if (session.id.toString() !== authHeaderUserId) {
    console.error('Authorization header does not match decrypted user ID')
    throw new Error('Authorization header does not match decrypted user ID')
  }

  return session
}
