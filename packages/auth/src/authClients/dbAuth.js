/* eslint-disable no-undef */
export const dbAuth = (client) => {
  const getToken = async () => {
    const response = await fetch(
      `${global.__REDWOOD__API_PROXY_PATH}/auth/getToken`
    )
    const token = await response.text()
    return token
  }

  const login = async (attributes) => {
    const { username, password } = attributes
    const response = await fetch(
      `${global.__REDWOOD__API_PROXY_PATH}/auth/login`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      }
    )
    return await response.json()
  }

  const logout = async () => {
    await fetch(`${global.__REDWOOD__API_PROXY_PATH}/auth/logout`, {
      method: 'POST',
    })
    return true
  }

  const signup = async (attributes) => {
    const response = await fetch(
      `${global.__REDWOOD__API_PROXY_PATH}/auth/signup`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(attributes),
      }
    )
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
