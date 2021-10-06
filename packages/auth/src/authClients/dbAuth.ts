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

export const dbAuth = (): AuthClient => {
  const forgotPassword = async (username: string) => {
    const response = await fetch(`${global.__REDWOOD__API_PROXY_PATH}/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, method: 'forgotPassword' }),
    })
    return await response.json()
  }

  const getToken = async () => {
    const response = await fetch(
      `${global.REDWOOD_API_URL}/auth?method=getToken`
    )
    const token = await response.text()

    if (token.length === 0) {
      return null
    } else {
      return token
    }
  }

  const login = async (attributes: LoginAttributes) => {
    const { username, password } = attributes
    const response = await fetch(`${global.REDWOOD_API_URL}/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, method: 'login' }),
    })
    return await response.json()
  }

  const logout = async () => {
    await fetch(`${global.REDWOOD_API_URL}/auth`, {
      method: 'POST',
      body: JSON.stringify({ method: 'logout' }),
    })
    return true
  }

  const resetPassword = async (attributes: ResetPasswordAttributes) => {
    const response = await fetch(`${global.__REDWOOD__API_PROXY_PATH}/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...attributes, method: 'resetPassword' }),
    })
    return await response.json()
  }

  const signup = async (attributes: SignupAttributes) => {
    const response = await fetch(`${global.REDWOOD_API_URL}/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...attributes, method: 'signup' }),
    })
    return await response.json()
  }

  const validateResetToken = async (resetToken: string | null) => {
    const response = await fetch(`${global.__REDWOOD__API_PROXY_PATH}/auth`, {
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
