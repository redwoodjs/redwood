import { AuthClient } from './index'

export interface LoginAttributes {
  username: string
  password: string
}

export interface ResetPasswordAttributes {
  token: string
  password: string
}

export type SignupAttributes = Record<string, unknown> & LoginAttributes

export type DbAuth = () => null

export type DbAuthConfig = {
  fetchConfig: {
    credentials: 'include' | 'same-origin'
  }
}

// ms to wait before calling getToken() again
const NEXT_TOKEN_CHECK: number = 5000

let lastTokenCheckAt: Date = new Date('1970-01-01T00:00:00')
let token: string

export const dbAuth = (
  _client: DbAuth,
  config: DbAuthConfig = { fetchConfig: { credentials: 'same-origin' } }
): AuthClient => {
  const { credentials } = config.fetchConfig

  const forgotPassword = async (username: string) => {
    const response = await fetch(global.RWJS_API_DBAUTH_URL, {
      credentials,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, method: 'forgotPassword' }),
    })
    return await response.json()
  }

  const getToken = async () => {
    // only fetch a new token if we haven't got one in the last few seconds
    // this is a tradeoff between not hitting the server for a new token for
    // every query, and making sure that if the server decides to invalidate
    // the user that the web-side finds out realtively quickly
    const now = new Date()

    if (!lastTokenCheckAt || now.getTime() - lastTokenCheckAt.getTime() > NEXT_TOKEN_CHECK) {
      const response = await fetch(
        `${global.RWJS_API_DBAUTH_URL}?method=getToken`,
        { credentials }
      )
      token = await response.text()
      lastTokenCheckAt = new Date()
    }

    if (token.length === 0) {
      return null
    } else {
      return token
    }
  }

  const login = async (attributes: LoginAttributes) => {
    const { username, password } = attributes
    const response = await fetch(global.RWJS_API_DBAUTH_URL, {
      credentials,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, method: 'login' }),
    })
    return await response.json()
  }

  const logout = async () => {
    await fetch(global.RWJS_API_DBAUTH_URL, {
      credentials,
      method: 'POST',
      body: JSON.stringify({ method: 'logout' }),
    })
    return true
  }

  const resetPassword = async (attributes: ResetPasswordAttributes) => {
    const response = await fetch(global.RWJS_API_DBAUTH_URL, {
      credentials,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...attributes, method: 'resetPassword' }),
    })
    return await response.json()
  }

  const signup = async (attributes: SignupAttributes) => {
    const response = await fetch(global.RWJS_API_DBAUTH_URL, {
      credentials,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...attributes, method: 'signup' }),
    })
    return await response.json()
  }

  const validateResetToken = async (resetToken: string | null) => {
    const response = await fetch(global.RWJS_API_DBAUTH_URL, {
      credentials,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resetToken, method: 'validateResetToken' }),
    })
    return await response.json()
  }

  return {
    type: 'dbAuth',
    client: () => null,
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
