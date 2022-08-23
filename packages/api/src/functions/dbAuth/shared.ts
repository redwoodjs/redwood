import type { APIGatewayProxyEvent } from 'aws-lambda'
import CryptoJS from 'crypto-js'

import * as DbAuthError from './errors'

// Extracts the cookie from an event, handling lower and upper case header
// names.
// Checks for cookie in headers in dev when user has generated graphiql headers
export const extractCookie = (event: APIGatewayProxyEvent) => {
  let cookieFromGraphiqlHeader
  if (process.env.NODE_ENV === 'development') {
    try {
      cookieFromGraphiqlHeader = JSON.parse(event.body ?? '{}').extensions
        ?.headers?.cookie
    } catch (e) {
      return event.headers.cookie || event.headers.Cookie
    }
  }
  return (
    event.headers.cookie || event.headers.Cookie || cookieFromGraphiqlHeader
  )
}

// decrypts the session cookie and returns an array: [data, csrf]
export const decryptSession = (text: string | null) => {
  if (!text || text.trim() === '') {
    return []
  }

  try {
    const decoded = CryptoJS.AES.decrypt(
      text,
      process.env.SESSION_SECRET as string
    ).toString(CryptoJS.enc.Utf8)
    const [data, csrf] = decoded.split(';')
    const json = JSON.parse(data)

    return [json, csrf]
  } catch (e) {
    throw new DbAuthError.SessionDecryptionError()
  }
}

// returns the actual value of the session cookie
export const getSession = (text?: string) => {
  if (typeof text === 'undefined' || text === null) {
    return null
  }

  const cookies = text.split(';')
  const sessionCookie = cookies.find((cook) => {
    return cook.split('=')[0].trim() === 'session'
  })

  if (!sessionCookie || sessionCookie === 'session=') {
    return null
  }

  return sessionCookie.split('=')[1].trim()
}

// Convenience function to get session, decrypt, and return session data all
// at once. Accepts the `event` argument from a Lambda function call.
export const dbAuthSession = (event: APIGatewayProxyEvent) => {
  if (extractCookie(event)) {
    const [session, _csrfToken] = decryptSession(
      getSession(extractCookie(event))
    )
    return session
  } else {
    return null
  }
}

export const webAuthnSession = (event: APIGatewayProxyEvent) => {
  if (!event.headers.cookie) {
    return null
  }

  const webAuthnCookie = event.headers.cookie.split(';').find((cook) => {
    return cook.split('=')[0].trim() === 'webAuthn'
  })

  if (!webAuthnCookie || webAuthnCookie === 'webAuthn=') {
    return null
  }

  return webAuthnCookie.split('=')[1].trim()
}

// hashes a password using either the given `salt` argument, or creates a new
// salt and hashes using that. Either way, returns an array with [hash, salt]
export const hashPassword = (text: string, salt?: string) => {
  const useSalt = salt || CryptoJS.lib.WordArray.random(128 / 8).toString()

  return [
    CryptoJS.PBKDF2(text, useSalt, { keySize: 256 / 32 }).toString(),
    useSalt,
  ]
}
