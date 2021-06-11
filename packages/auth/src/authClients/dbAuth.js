/* eslint-disable no-undef */
export const dbAuth = () => {
  const getToken = async () => {
    const response = await fetch(
      `${global.__REDWOOD__API_PROXY_PATH}/auth?method=getToken`
    )
    const token = await response.text()
    return token
  }

  const login = async (attributes) => {
    const { username, password } = attributes
    const response = await fetch(`${global.__REDWOOD__API_PROXY_PATH}/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, method: 'login' }),
    })
    return await response.json()
  }

  const logout = async () => {
    await fetch(`${global.__REDWOOD__API_PROXY_PATH}/auth`, {
      method: 'POST',
      body: JSON.stringify({ method: 'logout' }),
    })
    return true
  }

  const signup = async (attributes) => {
    const response = await fetch(`${global.__REDWOOD__API_PROXY_PATH}/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ method: 'signup', ...attributes }),
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
  }
}
