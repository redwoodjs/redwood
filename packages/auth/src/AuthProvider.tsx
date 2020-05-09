import type { ReactNode } from 'react'
import React, { useState, useEffect } from 'react'

import type {
  SupportedAuthTypes,
  SupportedAuthClients,
  Auth0User,
  GoTrueUser,
} from './authClient'
import { createAuthClient } from './authClient'

export interface AuthContextInterface {
  loading: boolean
  authenticated: boolean
  user: null | object // TODO: Provide a generic interface to the users object.
  login(): Promise<void>
  logout(): Promise<void>
  getToken(): Promise<null | string>
  client: null | SupportedAuthClients
  type: null | SupportedAuthTypes
}

export const AuthContext = React.createContext<Partial<AuthContextInterface>>(
  {}
)

/**
 * @example
 * ```js
 *  const client = new Auth0Client(options)
 *  // ...
 *  <AuthProvider client={client} type="auth0">
 *    {children}
 *  </AuthProvider>
 * ```
 */
export const AuthProvider = ({
  children,
  type,
  client,
}: {
  children: ReactNode
  type: SupportedAuthTypes
  client: SupportedAuthClients
}): JSX.Element => {
  const [loading, setLoading] = useState(true)
  const [authenticated, setAuthenticated] = useState(false)
  const [user, setUser] = useState<null | GoTrueUser | Auth0User>(null)

  // Map the methods from auth0 and netlify into a unified interface.
  const rwClient = createAuthClient(client, type)

  // Attempt to restore the authentication state when a user visits the app again.
  useEffect(() => {
    const restoreAuthState = async () => {
      rwClient.restoreAuthState && (await rwClient.restoreAuthState())

      const user = await rwClient.currentUser()
      setUser(user)
      setAuthenticated(user !== null)
      setLoading(false)
    }
    restoreAuthState()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const login = async (...args) => {
    const user = await rwClient.login(...args)
    setUser(user)
    setAuthenticated(user !== null)
  }

  const logout = async () => {
    await rwClient.logout()
    setUser(null)
    setAuthenticated(false)
  }

  return (
    <AuthContext.Provider
      value={{
        loading,
        authenticated,
        user,
        login,
        logout,
        getToken: rwClient.getToken,
        client: rwClient.client,
        type: rwClient.type,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
