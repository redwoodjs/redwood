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
  responseType: string,
  attributes: Record<string, unknown> = {}
) => {
  const response = await fetch(`${global.__REDWOOD__API_PROXY_PATH}/auth`, {
    method: verb,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...attributes, method }),
  })

  if (responseType === 'json') {
    return await response.json()
  } else  {
    return await response.text()
  }
}

export const dbAuth = (): AuthClient => {
  const getToken = async () => {
    const token = await request('GET', 'logout', 'text')

    if (token.length === 0) {
      return null
    } else {
      return token
    }
  }

  const login = async (attributes: LoginAttributes) => {
    const { username, password } = attributes

    return await request('POST', 'login', 'json', { username, password })
  }

  const logout = async () => {
    await request('POST', 'logout', 'text')

    return true
  }

  const signup = async (attributes: SignupAttributes) => {
    return await request('POST', 'signup', 'json', attributes)
  }

  const forgotPassword = async (username: string) => {
    return await request('POST', 'forgotPassword', 'json', { username })
  }

  const resetPassword = async (password: string) => {
    return await request('POST', 'resetPassword', 'json', { password })
  }

  const validateResetToken = async (token: string | null) => {
    return await request('POST', 'validateResetToken', 'json', { token })
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
