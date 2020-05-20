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
  isAuthenticated: boolean
  currentUser: null | GoTrueUser | Auth0User
  logIn(): Promise<void>
  logOut(): Promise<void>
  getToken(): Promise<null | string>
  client: null | SupportedAuthClients
  type: null | SupportedAuthTypes
}

export const AuthContext = React.createContext<Partial<AuthContextInterface>>(
  {}
)

type AuthProviderProps = {
  client: AuthClient
  type: SupportedAuthTypes
}

type AuthProviderState = {
  loading: boolean
  isAuthenticated: boolean
  currentUser: null | Auth0User | GoTrueUser
}
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
}
