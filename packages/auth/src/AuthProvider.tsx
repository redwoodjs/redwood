import React from 'react'

import type {
  AuthClient,
  SupportedAuthTypes,
  SupportedAuthClients,
  SupportedUserMetadata,
} from './authClients'
import { createAuthClient } from './authClients'

export interface CurrentUser {}

export interface AuthContextInterface {
  /* Determining your current authentication state */
  loading: boolean
  isAuthenticated: boolean
  /* The current user's data from the `getCurrentUser` function on the api side */
  currentUser: null | CurrentUser
  /* The user's metadata from the auth provider */
  userMetadata: null | SupportedUserMetadata
  logIn(): Promise<void>
  logOut(): Promise<void>
  getToken(): Promise<null | string>
  /**
   * Fetches the "currentUser" from the api side,
   * but does not update the current user state.
   **/
  getCurrentUser(): Promise<null | CurrentUser>
  /**
   * Redetermine authentication state and update the state.
   */
  reauthenticate(): Promise<void>
  /**
   * A reference to the client that you passed into the `AuthProvider`,
   * which is useful if we do not support some specific functionality.
   */
  client: SupportedAuthClients
  type: SupportedAuthTypes
  hasError: boolean
  error: Error
}

export const AuthContext = React.createContext<Partial<AuthContextInterface>>(
  {}
)

type AuthProviderProps = {
  client: SupportedAuthClients
  type: SupportedAuthTypes
  skipFetchCurrentUser?: boolean
}

type AuthProviderState = {
  loading: boolean
  isAuthenticated: boolean
  userMetadata: null | object
  currentUser: null | undefined | CurrentUser
  hasError: boolean
  error?: Error
}
/**
 * @example
 * ```js
 *  const client = new Auth0Client(options)
 *  // ...
 *  <AuthProvider client={client} type="auth0" skipFetchCurrentUser={true}>
 *    {children}
 *  </AuthProvider>
 * ```
 */
export class AuthProvider extends React.Component<
  AuthProviderProps,
  AuthProviderState
> {
  static defaultProps = {
    skipFetchCurrentUser: false,
  }

  state: AuthProviderState = {
    loading: true,
    isAuthenticated: false,
    userMetadata: null,
    currentUser: null,
    hasError: false,
  }

  rwClient: AuthClient

  constructor(props: AuthProviderProps) {
    super(props)
    this.rwClient = createAuthClient(props.client, props.type)
  }

  async componentDidMount() {
    await this.rwClient.restoreAuthState?.()
    return this.reauthenticate()
  }

  getCurrentUser = async () => {
    if (this.props.skipFetchCurrentUser) {
      return undefined
    }

    const token = await this.rwClient.getToken()
    const response = await window.fetch(
      `${window.__REDWOOD__API_PROXY_PATH}/graphql`,
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'auth-provider': this.rwClient.type,
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          query:
            'query __REDWOOD__AUTH_GET_CURRENT_USER { redwood { currentUser } }',
        }),
      }
    )

    if (response.ok) {
      const { data } = await response.json()
      return data?.redwood?.currentUser
    } else {
      throw new Error(
        `Could not fetch current user: ${response.statusText} (${response.status})`
      )
    }
  }

  reauthenticate = async () => {
    const notAuthenticatedState: AuthProviderState = {
      isAuthenticated: false,
      currentUser: null,
      userMetadata: null,
      loading: false,
      hasError: false,
    }

    try {
      const userMetadata = await this.rwClient.getUserMetadata()
      if (!userMetadata) {
        this.setState(notAuthenticatedState)
      } else {
        const currentUser = await this.getCurrentUser()
        this.setState({
          userMetadata,
          currentUser,
          isAuthenticated: true,
          loading: false,
        })
      }
    } catch (e) {
      this.setState({
        ...notAuthenticatedState,
        hasError: true,
        error: e,
      })
    }
  }

  logIn = async (options?: any) => {
    await this.rwClient.login(options)
    return this.reauthenticate()
  }

  logOut = async (options?: any) => {
    await this.rwClient.logout(options)
    this.setState({
      userMetadata: null,
      currentUser: null,
      isAuthenticated: false,
      hasError: false,
      error: undefined,
    })
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
          getCurrentUser: this.getCurrentUser,
          reauthenticate: this.reauthenticate,
          client,
          type,
        }}
      >
        {children}
      </AuthContext.Provider>
    )
  }
}
