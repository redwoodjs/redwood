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
const NEXT_TOKEN_CHECK: number = 5000

let getTokenResponse: null | Promise<string | null>
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
    if (getTokenResponse) {
      return getTokenResponse
    }

    const now = new Date()

    if (
      !lastTokenCheckAt ||
      now.getTime() - lastTokenCheckAt.getTime() > NEXT_TOKEN_CHECK
    ) {
      if (getTokenResponse) {
        return getTokenResponse
      }

      getTokenResponse = new Promise(async (resolve) => {
        const result = fetch(`${global.RWJS_API_DBAUTH_URL}?method=getToken`, {
          credentials,
        })
        const response = await result
        token = await response.text()
        lastTokenCheckAt = new Date()
        getTokenResponse = null

        if (token.length === 0) {
          resolve(null)
        } else {
          resolve(token)
        }
      })
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
