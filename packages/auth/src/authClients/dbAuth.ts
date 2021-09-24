import { AuthClient } from './index'

export interface LoginAttributes {
  username: string
  password: string
}

export type SignupAttributes = Record<string, unknown> & LoginAttributes

export type DbAuth = () => null

const request = async (
  verb: string,
  method: string,
  attributes: Record<string, unknown> = {}
) => {
  const response = await fetch(`${global.__REDWOOD__API_PROXY_PATH}/auth`, {
    method: verb,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...attributes, method }),
  })

  return await response.json()
}

export const dbAuth = (): AuthClient => {
  const getToken = async () => {
    // don't use request() here because we need the raw text, not JSON
    const response = await fetch(
      `${global.__REDWOOD__API_PROXY_PATH}/auth?method=getToken`
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

    return await request('POST', 'login', { username, password })
  }

  const logout = async () => {
    await request('POST', 'logout')

    return true
  }

  const signup = async (attributes: SignupAttributes) => {
    return await request('POST', 'signup', attributes)
  }

  const forgotPassword = async (username: string) => {
    return await request('POST', 'forgotPassword', { username })
  }

  const resetPassword = async (password: string) => {
    return await request('POST', 'resetPassword', { password })
  }

  const validateResetToken = async (token: string | null) => {
    return await request('POST', 'validateResetToken', { token })
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
