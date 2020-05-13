import React from 'react'

import type {
  SupportedAuthTypes,
  SupportedAuthClients,
  Auth0User,
  GoTrueUser,
  AuthClient,
} from './authClient'
import { createAuthClient } from './authClient'

export interface AuthContextInterface {
  loading: boolean
  authenticated: boolean
  currentUser: null | GoTrueUser | Auth0User
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

type AuthProviderProps = {
  client: AuthClient
  type: SupportedAuthTypes
}

type AuthProviderState = {
  loading: boolean
  authenticated: boolean
  currentUser: null | Auth0User | GoTrueUser
}

export class AuthProvider extends React.Component<
  AuthProviderProps,
  AuthProviderState
> {
  state: AuthProviderState = {
    loading: true,
    authenticated: false,
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
      authenticated: currentUser !== null,
      loading: false,
    })
  }

  login = async () => {
    const currentUser = await this.rwClient.login()
    this.setState({ currentUser, authenticated: currentUser !== null })
  }

  logout = async () => {
    await this.rwClient.logout()
    this.setState({ currentUser: null, authenticated: false })
  }

  render() {
    const { client, type, children } = this.props

    return (
      <AuthContext.Provider
        value={{
          ...this.state,
          login: this.login,
          logout: this.logout,
          getToken: this.rwClient.getToken,
          client: client,
          type: type,
        }}
      >
        {children}
      </AuthContext.Provider>
    )
  }
}
