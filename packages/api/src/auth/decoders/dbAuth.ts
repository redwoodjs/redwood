// @ts-ignore What the hell is a declaration file?
import { decryptSession, getSession } from '../../functions/dbAuthHelpers'

export const dbAuth = (authHeaderValue: string, req: { event: any }) => {
  const encrypted = getSession(req.event.headers['cookie'])

  if (encrypted) {
    const authHeaderUserId = parseInt(authHeaderValue)
    const [session, _csrfToken] = decryptSession(encrypted)

    if (session.id !== authHeaderUserId) {
      throw new Error(
        'Error comparing Authorization header value to decrypted user'
      )
    }

    return session
  } else {
    return null
  }
}
