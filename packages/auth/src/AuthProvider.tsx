import type { ReactNode } from 'react'
import React, { useRef, useState, useEffect } from 'react'

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
  currentUser: null | object // TODO: Provide a generic interface to the users object.
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
  // TODO: Change this to state.
  const [loading, setLoading] = useState(true)
  const [authenticated, setAuthenticated] = useState(false)
  const [currentUser, setCurrentUser] = useState<null | GoTrueUser | Auth0User>(
    null
  )
  const rwClient = useRef(createAuthClient(client, type))

  // Attempt to restore the authentication state when a user visits the app again.
  useEffect(() => {
    // Map the methods from auth0 and netlify into a unified interface.
    const restoreAuthState = async () => {
      rwClient.current.restoreAuthState &&
        (await rwClient.current.restoreAuthState())

      const user = await rwClient.current.currentUser()
      setCurrentUser(user)
      setAuthenticated(user !== null)
      setLoading(false)
    }
    restoreAuthState()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const login = async (...args) => {
    const user = await rwClient.current.login(...args)
    setCurrentUser(user)
    setAuthenticated(user !== null)
  }

  const logout = async () => {
    await rwClient.current.logout()
    setCurrentUser(null)
    setAuthenticated(false)
  }

  return (
    <AuthContext.Provider
      value={{
        loading,
        authenticated,
        currentUser,
        login,
        logout,
        getToken: rwClient.current.getToken,
        client: rwClient.current.client,
        type: rwClient.current.type,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
