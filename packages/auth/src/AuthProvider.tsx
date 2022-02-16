import React from 'react'

import { createAuthClient } from './authClients'
import type {
  AuthClient,
  SupportedAuthTypes,
  SupportedAuthClients,
  SupportedUserMetadata,
} from './authClients'

export interface CurrentUser {
  roles?: Array<string>
}

export interface AuthContextInterface {
  /* Determining your current authentication state */
  loading: boolean
  isAuthenticated: boolean
  /* The current user's data from the `getCurrentUser` function on the api side */
  currentUser: null | CurrentUser
  /* The user's metadata from the auth provider */
  userMetadata: null | SupportedUserMetadata
  logIn(options?: unknown): Promise<any>
  logOut(options?: unknown): Promise<any>
  signUp(options?: unknown): Promise<any>
  getToken(): Promise<null | string>
  /**
   * Fetches the "currentUser" from the api side,
   * but does not update the current user state.
   **/
  getCurrentUser(): Promise<null | CurrentUser>
  /**
   * Checks if the "currentUser" from the api side
   * is assigned a role or one of a list of roles.
   * If the user is assigned any of the provided list of roles,
   * the hasRole is considered to be true.
   **/
  hasRole(role: string | string[]): boolean
  /**
   * Redetermine authentication state and update the state.
   */
  reauthenticate(): Promise<void>
  forgotPassword(username: string): Promise<any>
  resetPassword(options?: unknown): Promise<any>
  validateResetToken(resetToken: string | null): Promise<any>
  /**
   * A reference to the client that you passed into the `AuthProvider`,
   * which is useful if we do not support some specific functionality.
   */
  client?: SupportedAuthClients
  type?: SupportedAuthTypes
  hasError: boolean
  error?: Error
}

export const AuthContext = React.createContext<AuthContextInterface>({
  loading: true,
  isAuthenticated: false,
  userMetadata: null,
  currentUser: null,
  logIn: () => Promise.resolve(),
  logOut: () => Promise.resolve(),
  signUp: () => Promise.resolve(),
  getToken: () => Promise.resolve(null),
  getCurrentUser: () => Promise.resolve(null),
  hasRole: () => true,
  reauthenticate: () => Promise.resolve(),
  forgotPassword: () => Promise.resolve(),
  resetPassword: () => Promise.resolve(),
  validateResetToken: () => Promise.resolve(),
  hasError: false,
})

type AuthProviderProps =
  | {
      client: SupportedAuthClients
      type: Omit<SupportedAuthTypes, 'dbAuth' | 'clerk'>
      skipFetchCurrentUser?: boolean
    }
  | {
      client?: never
      type: 'dbAuth' | 'clerk'
      skipFetchCurrentUser?: boolean
    }

type AuthProviderState = {
  loading: boolean
  isAuthenticated: boolean
  userMetadata: null | Record<string, any>
  currentUser: null | CurrentUser
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
    this.rwClient = createAuthClient(
      props.client as SupportedAuthClients,
      props.type as SupportedAuthTypes
    )
  }

  async componentDidMount() {
    await this.rwClient.restoreAuthState?.()
    return this.reauthenticate()
  }

  getApiGraphQLUrl = () => {
    return global.RWJS_API_GRAPHQL_URL
  }

  getCurrentUser = async (): Promise<Record<string, unknown>> => {
    // Always get a fresh token, rather than use the one in state
    const token = await this.getToken()
    const response = await global.fetch(this.getApiGraphQLUrl(), {
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
    })

    if (response.ok) {
      const { data } = await response.json()
      return data?.redwood?.currentUser
    } else {
      throw new Error(
        `Could not fetch current user: ${response.statusText} (${response.status})`
      )
    }
  }

  /**
   * @example
   * ```js
   *  hasRole("editor")
   *  hasRole(["editor"])
   *  hasRole(["editor", "author"])
   * ```
   *
   * Checks if the "currentUser" from the api side
   * is assigned a role or one of a list of roles.
   * If the user is assigned any of the provided list of roles,
   * the hasRole is considered to be true.
   */
  hasRole = (role: string | string[]): boolean => {
    if (
      typeof role !== 'undefined' &&
      this.state.currentUser &&
      this.state.currentUser.roles
    ) {
      if (typeof role === 'string') {
        return this.state.currentUser.roles?.includes(role) || false
      }

      if (Array.isArray(role)) {
        return this.state.currentUser.roles.some((r) => role.includes(r))
      }
    }

    return false
  }

  getToken = async () => {
    return this.rwClient.getToken()
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
        await this.getToken()

        const currentUser = this.props.skipFetchCurrentUser
          ? null
          : await this.getCurrentUser()

        this.setState({
          ...this.state,
          userMetadata,
          currentUser,
          isAuthenticated: true,
          loading: false,
        })
      }
    } catch (e: any) {
      this.setState({
        ...notAuthenticatedState,
        hasError: true,
        error: e as Error,
      })
    }
  }

  logIn = async (options?: any) => {
    this.setState({ loading: true })
    const loginOutput = await this.rwClient.login(options)
    await this.reauthenticate()

    return loginOutput
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

  signUp = async (options?: any) => {
    const signupOutput = await this.rwClient.signup(options)
    await this.reauthenticate()
    return signupOutput
  }

  forgotPassword = async (username: string) => {
    if (this.rwClient.forgotPassword) {
      return await this.rwClient.forgotPassword(username)
    } else {
      throw new Error(
        `Auth client ${this.rwClient.type} does not implement this function`
      )
    }
  }

  resetPassword = async (options?: any) => {
    if (this.rwClient.resetPassword) {
      return await this.rwClient.resetPassword(options)
    } else {
      throw new Error(
        `Auth client ${this.rwClient.type} does not implement this function`
      )
    }
  }

  validateResetToken = async (resetToken: string | null) => {
    if (this.rwClient.validateResetToken) {
      return await this.rwClient.validateResetToken(resetToken)
    } else {
      throw new Error(
        `Auth client ${this.rwClient.type} does not implement this function`
      )
    }
  }

  render() {
    const { client, type, children } = this.props

    return (
      <AuthContext.Provider
        value={{
          ...this.state,
          logIn: this.logIn,
          logOut: this.logOut,
          signUp: this.signUp,
          getToken: this.getToken,
          getCurrentUser: this.getCurrentUser,
          hasRole: this.hasRole,
          reauthenticate: this.reauthenticate,
          forgotPassword: this.forgotPassword,
          resetPassword: this.resetPassword,
          validateResetToken: this.validateResetToken,
          client,
          type: type as SupportedAuthTypes,
        }}
      >
        {children}
      </AuthContext.Provider>
    )
  }
}
