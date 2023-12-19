import type { CurrentUser } from '@redwoodjs/auth'
import { createAuthentication } from '@redwoodjs/auth'

import type { WebAuthnClientType } from './webAuthn'

export interface LoginAttributes {
  username: string
  password: string
}

export interface ResetPasswordAttributes {
  resetToken: string
  password: string
}

export type SignupAttributes = Record<string, unknown> & LoginAttributes

const TOKEN_CACHE_TIME = 5000

export function createAuth(
  dbAuthClient: ReturnType<typeof createDbAuthClient>,
  customProviderHooks?: {
    useCurrentUser?: () => Promise<CurrentUser>
    useHasRole?: (
      currentUser: CurrentUser | null
    ) => (rolesToCheck: string | string[]) => boolean
  }
) {
  return createAuthentication(dbAuthClient, customProviderHooks)
}

export interface DbAuthClientArgs {
  webAuthn?: InstanceType<WebAuthnClientType>
  dbAuthUrl?: string
  fetchConfig?: {
    credentials?: 'include' | 'same-origin'
  }
}

export function createDbAuthClient({
  webAuthn,
  dbAuthUrl,
  fetchConfig,
}: DbAuthClientArgs = {}) {
  const credentials = fetchConfig?.credentials || 'same-origin'
  webAuthn?.setAuthApiUrl(dbAuthUrl)

  let getTokenPromise: null | Promise<string | null>
  let lastTokenCheckAt = new Date('1970-01-01T00:00:00')
  let cachedToken: string | null

  const getApiDbAuthUrl = () => {
    return dbAuthUrl || `${RWJS_API_URL}/auth`
  }

  const resetAndFetch = async (...params: Parameters<typeof fetch>) => {
    resetTokenCache()
    return fetch(...params)
  }

  const isTokenCacheExpired = () => {
    const now = new Date()
    return now.getTime() - lastTokenCheckAt.getTime() > TOKEN_CACHE_TIME
  }

  const resetTokenCache = () => {
    lastTokenCheckAt = new Date('1970-01-01T00:00:00')
    cachedToken = null
  }

  const forgotPassword = async (username: string) => {
    const response = await resetAndFetch(getApiDbAuthUrl(), {
      credentials,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, method: 'forgotPassword' }),
    })

    return response.json()
  }

  const getToken = async () => {
    // Return the existing fetch promise, so that parallel calls
    // to getToken only cause a single fetch
    if (getTokenPromise) {
      return getTokenPromise
    }

    if (isTokenCacheExpired()) {
      getTokenPromise = fetch(`${getApiDbAuthUrl()}?method=getToken`, {
        credentials,
      })
        .then((response) => response.text())
        .then((tokenText) => {
          lastTokenCheckAt = new Date()
          cachedToken = tokenText.length === 0 ? null : tokenText
          return cachedToken
        })
        .catch(() => {
          return null
        })
        .finally(() => {
          getTokenPromise = null
        })

      return getTokenPromise
    }

    return cachedToken
  }

  const login = async ({ username, password }: LoginAttributes) => {
    const response = await resetAndFetch(getApiDbAuthUrl(), {
      credentials,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, method: 'login' }),
    })

    return response.json()
  }

  const logout = async () => {
    await resetAndFetch(getApiDbAuthUrl(), {
      credentials,
      method: 'POST',
      body: JSON.stringify({ method: 'logout' }),
    })

    return true
  }

  const resetPassword = async (attributes: ResetPasswordAttributes) => {
    const response = await resetAndFetch(getApiDbAuthUrl(), {
      credentials,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...attributes, method: 'resetPassword' }),
    })

    return response.json()
  }

  const signup = async (attributes: SignupAttributes) => {
    const response = await resetAndFetch(getApiDbAuthUrl(), {
      credentials,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...attributes, method: 'signup' }),
    })

    return response.json()
  }

  const validateResetToken = async (resetToken: string | null) => {
    const response = await resetAndFetch(getApiDbAuthUrl(), {
      credentials,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resetToken, method: 'validateResetToken' }),
    })

    return response.json()
  }

  return {
    type: 'dbAuth',
    client: webAuthn,
    login,
    logout,
    signup,
    getToken,
    getUserMetadata: getToken,
    forgotPassword,
    resetPassword,
    validateResetToken,
  }
}
