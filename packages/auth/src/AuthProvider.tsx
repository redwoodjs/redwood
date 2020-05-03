<<<<<<< HEAD
import React from 'react'
=======
import type { ReactNode } from 'react'
import React, { useState, useEffect } from 'react'
>>>>>>> bb1ab34... Add auth package.

import type {
  SupportedAuthTypes,
  SupportedAuthClients,
  Auth0User,
<<<<<<< HEAD
  GoTrueUser,
  AuthClient,
  MagicUser,
=======
  NetlifyUser,
>>>>>>> bb1ab34... Add auth package.
} from './authClient'
import { createAuthClient } from './authClient'

export interface AuthContextInterface {
  loading: boolean
<<<<<<< HEAD
  isAuthenticated: boolean
  currentUser: null | GoTrueUser | Auth0User | MagicUser
  logIn(): Promise<void>
  logOut(): Promise<void>
=======
  authenticated: boolean
  user: null | object // TODO: Provide a generic interface to the users object.
  login(): Promise<void>
  logout(): Promise<void>
>>>>>>> bb1ab34... Add auth package.
  getToken(): Promise<null | string>
  client: null | SupportedAuthClients
  type: null | SupportedAuthTypes
}

export const AuthContext = React.createContext<Partial<AuthContextInterface>>(
  {}
)

<<<<<<< HEAD
type AuthProviderProps = {
  client: AuthClient
  type: SupportedAuthTypes
}

type AuthProviderState = {
  loading: boolean
  isAuthenticated: boolean
  currentUser: null | Auth0User | GoTrueUser
}
=======
>>>>>>> bb1ab34... Add auth package.
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
<<<<<<< HEAD
export class AuthProvider extends React.Component<
  AuthProviderProps,
  AuthProviderState
> {
  state: AuthProviderState = {
    loading: true,
    isAuthenticated: false,
    currentUser: null,
  }

  rwClient: SupportedAuthClients

  constructor(props) {
    super(props)
    this.rwClient = createAuthClient(props.client, props.type)
  }

  async componentDidMount() {
    await this.rwClient.restoreAuthState?.()
    const currentUser = await this.rwClient.currentUser()
    this.setState({
      currentUser,
      isAuthenticated: currentUser !== null,
      loading: false,
    })
  }

  logIn = async (options?) => {
    const currentUser = await this.rwClient.login(options)
    this.setState({ currentUser, isAuthenticated: currentUser !== null })
  }

  logOut = async () => {
    await this.rwClient.logout()
    this.setState({ currentUser: null, isAuthenticated: false })
  }

  render() {
    const { client, type, children } = this.props

    return (
      <AuthContext.Provider
        value={{
          ...this.state,
          logIn: this.logIn,
          logOut: this.logOut,
          getToken: this.rwClient.getToken,
          client: client,
          type: type,
        }}
      >
        {children}
      </AuthContext.Provider>
    )
  }
=======
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
  const [user, setUser] = useState<null | NetlifyUser | Auth0User>(null)

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
>>>>>>> bb1ab34... Add auth package.
}
