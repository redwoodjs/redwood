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

let getTokenResponse: null | Promise<string | null>

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
    console.info('  client getToken()')
    if (getTokenResponse) {
      console.info('    return promise')
      return getTokenResponse
    }

    console.info('    fetch')
    // @ts-ignore
    getTokenResponse = fetch(`${global.RWJS_API_DBAUTH_URL}?method=getToken`, { credentials })
    // @ts-ignore
    const response = await getTokenResponse
    // @ts-ignore
    const token = await response.text()
    getTokenResponse = null

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
