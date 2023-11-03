import type { APIGatewayProxyEvent } from 'aws-lambda'
import CryptoJS from 'crypto-js'

import { getConfig, getConfigPath } from '@redwoodjs/project-config'

import * as DbAuthError from './errors'

// Extracts the cookie from an event, handling lower and upper case header names.
const eventHeadersCookie = (event: APIGatewayProxyEvent) => {
  return event.headers.cookie || event.headers.Cookie
}

// When in development environment, check for cookie in the request extension headers
// if user has generated graphiql headers
const eventGraphiQLHeadersCookie = (event: APIGatewayProxyEvent) => {
  if (process.env.NODE_ENV === 'development') {
    try {
      const jsonBody = JSON.parse(event.body ?? '{}')
      return (
        jsonBody?.extensions?.headers?.cookie ||
        jsonBody?.extensions?.headers?.Cookie
      )
    } catch {
      // sometimes the event body isn't json
      return
    }
  }

  return
}

// Extracts the session cookie from an event, handling both
// development environment GraphiQL headers and production environment headers.
export const extractCookie = (event: APIGatewayProxyEvent) => {
  return eventGraphiQLHeadersCookie(event) || eventHeadersCookie(event)
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
export const getSession = (
  text: string | undefined,
  cookieNameOption: string | undefined
) => {
  if (typeof text === 'undefined' || text === null) {
    return null
  }

  const cookies = text.split(';')
  const sessionCookie = cookies.find((cookie) => {
    return cookie.split('=')[0].trim() === cookieName(cookieNameOption)
  })

  if (!sessionCookie || sessionCookie === `${cookieName(cookieNameOption)}=`) {
    return null
  }

  return sessionCookie.split('=')[1].trim()
}

// Convenience function to get session, decrypt, and return session data all
// at once. Accepts the `event` argument from a Lambda function call and the
// name of the dbAuth session cookie
export const dbAuthSession = (
  event: APIGatewayProxyEvent,
  cookieNameOption: string | undefined
) => {
  if (extractCookie(event)) {
    const [session, _csrfToken] = decryptSession(
      getSession(extractCookie(event), cookieNameOption)
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

export const hashToken = (token: string) => {
  return CryptoJS.SHA256(token).toString(CryptoJS.enc.Hex)
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

export const cookieName = (name: string | undefined) => {
  const port = getPort()
  const cookieName = name?.replace('%port%', '' + port) ?? 'session'

  return cookieName
}

function getPort() {
  let configPath

  try {
    configPath = getConfigPath()
  } catch {
    // If this throws, we're in a serverless environment, and the `redwood.toml` file doesn't exist.
    return 8911
  }

  return getConfig(configPath).api.port
}
