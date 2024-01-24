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

// const TOKEN_CACHE_TIME = 5000

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

  const getApiDbAuthUrl = () => {
    return dbAuthUrl || `${RWJS_API_URL}/auth`
  }

  const resetAndFetch = async (...params: Parameters<typeof fetch>) => {
    return fetch(...params)
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
    // Not really used
    return null
  }

  const login = async ({ username, password }: LoginAttributes) => {
    const response = await resetAndFetch(getApiDbAuthUrl(), {
      credentials,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, method: 'login' }),
    })

    if (typeof window !== undefined) {
      document.cookie = 'auth-provider=dbAuth'
    }

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
    // @TODO getToken and getUserMetadata are not required with SSR-cookie auth
    // Remove these functions
    getToken,
    // This forces useReauthenticate to call getCurrentUser. If we make the change in useReauthenticate
    // it would break all other auth providers. getUserMetadata is a "shortcut" for getting the user
    // without fetching the actual currentUser from the server. With cookie auth, _all_ providers will need
    // to fetch it from the server
    getUserMetadata: null as any,
    // -----
    forgotPassword,
    resetPassword,
    validateResetToken,
  }
}
