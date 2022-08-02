import React, { ReactNode, Fragment } from 'react'

import type {
  AuthClient,
  SupportedAuthTypes,
  // SupportedAuthConfig,
  SupportedAuthClients,
  SupportedUserMetadata,
} from './authClients'
// import type { WebAuthnClientType } from './webAuthn'

export interface CurrentUser {
  roles?: Array<string> | string
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
  /**
   * Clients should always return null or string
   * It is expected that they catch any errors internally
   */
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
  hasRole(rolesToCheck: string | string[]): boolean
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

export interface AuthService extends AuthContextInterface {
  rwClient: AuthClient
}

export const AuthContext = React.createContext<
  | AuthContextInterface
  | { services: Record<string, AuthService>; determineAuth: any }
>({
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

const AuthUpdateListener = ({
  rwClient,
  reauthenticate,
}: {
  rwClient?: AuthClient
  reauthenticate: () => Promise<void>
}) => {
  rwClient?.useListenForUpdates?.({ reauthenticate })

  return null
}

// type AuthProviderProps =
//   | {
//       client: SupportedAuthClients
//       type: Omit<SupportedAuthTypes, 'clerk' | 'dbAuth'>
//       config?: never
//       skipFetchCurrentUser?: boolean
//       children?: ReactNode | undefined
//     }
//   | {
//       client?: never
//       type: 'clerk'
//       config?: never
//       skipFetchCurrentUser?: boolean
//       children?: ReactNode | undefined
//     }
//   | {
//       client?: WebAuthnClientType
//       type: 'dbAuth'
//       config?: SupportedAuthConfig
//       skipFetchCurrentUser?: boolean
//       children?: ReactNode | undefined
//     }

type AuthProviderProps = {
  service: AuthService
  services?: Record<string, AuthService>
  determineAuth?: any
  children?: ReactNode | undefined
}

// type AuthProviderState = {
//   loading: boolean
//   isAuthenticated: boolean
//   userMetadata: null | Record<string, any>
//   currentUser: null | CurrentUser
//   hasError: boolean
//   error?: Error
// }

// const defaultAuthProviderState: AuthProviderState = {
//   loading: true,
//   isAuthenticated: false,
//   userMetadata: null,
//   currentUser: null,
//   hasError: false,
// }

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

// const determineAuth = (services) => {
//   services

//   return
// }

export const AuthProvider = (props: AuthProviderProps) => {
  const { service, services, determineAuth } = props
  if (services) {
    return (
      <AuthContext.Provider value={{ services, determineAuth }}>
        {props.children}
        {Object.entries(services).map(([name, service]) => (
          <Fragment key={name}>
            <AuthUpdateListener
              rwClient={service.rwClient}
              reauthenticate={service.reauthenticate}
            />
          </Fragment>
        ))}
      </AuthContext.Provider>
    )
  }

  const { rwClient, ...rest } = service

  return (
    <AuthContext.Provider
      value={{
        ...rest,
      }}
    >
      {props.children}
      <AuthUpdateListener
        rwClient={rwClient}
        reauthenticate={props.service.reauthenticate}
      />
    </AuthContext.Provider>
  )
}
