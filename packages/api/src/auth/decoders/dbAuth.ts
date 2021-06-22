import { dbAuthSession } from '../../functions/dbAuth/shared'

export const dbAuth = (authHeaderValue: string, req: { event: any }) => {
  const session = dbAuthSession(req.event)
  const authHeaderUserId = authHeaderValue

  // const encrypted = getSession(req.event.headers['cookie'])

  // if (!encrypted) {
  //   return null
  // }

  // const [session, _csrfToken] = decryptSession(encrypted)

  if (session.id.toString() !== authHeaderUserId) {
    throw new Error('Authorization header does not match decrypted user ID')
  }

  return session
}
