import React, {
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'

import { createAuthClient } from './authClients'
import type {
  AuthClient,
  SupportedAuthTypes,
  SupportedAuthConfig,
  SupportedAuthClients,
  SupportedUserMetadata,
} from './authClients'
import {
  AuthClientWithUpdateHook,
  isAuthClientWithUpdateHook,
} from './authClients/AuthClient'

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

const AuthUpdateListener = ({
  rwClient,
  reauthenticate,
}: {
  rwClient: AuthClientWithUpdateHook
  reauthenticate: () => Promise<void>
}) => {
  rwClient.useListenForUpdates({ reauthenticate })
  return null
}

type AuthProviderProps =
  | {
      client: SupportedAuthClients
      type: Omit<SupportedAuthTypes, 'dbAuth' | 'clerk'>
      config?: never
      skipFetchCurrentUser?: boolean
      children?: ReactNode | undefined
    }
  | {
      client?: never
      type: 'clerk'
      config?: never
      skipFetchCurrentUser?: boolean
      children?: ReactNode | undefined
    }
  | {
      client?: never
      type: 'dbAuth'
      config?: SupportedAuthConfig
      skipFetchCurrentUser?: boolean
      children?: ReactNode | undefined
    }

type AuthProviderState = {
  loading: boolean
  isAuthenticated: boolean
  userMetadata: null | Record<string, any>
  currentUser: null | CurrentUser
  hasError: boolean
  error?: Error
}

const defaultAuthProviderState: AuthProviderState = {
  loading: true,
  isAuthenticated: false,
  userMetadata: null,
  currentUser: null,
  hasError: false,
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
export const AuthProvider = (props: AuthProviderProps) => {
  const skipFetchCurrentUser = props.skipFetchCurrentUser || false

  const [hasRestoredState, setHasRestoredState] = useState(false)

  const [authProviderState, setAuthProviderState] = useState(
    defaultAuthProviderState
  )

  const [rwClient, setRwClient] = useState<AuthClient>()

  const rwClientPromise: Promise<AuthClient> = useMemo(async () => {
    // If ever we rebuild the rwClient, we need to re-restore the state.
    // This is not desired behavior, but may happen if for some reason the host app's
    // auth configuration changes mid-flight.
    setHasRestoredState(false)

    const client = await createAuthClient(
      props.client as SupportedAuthClients,
      props.type as SupportedAuthTypes,
      props.config as SupportedAuthConfig
    )

    setRwClient(client)

    return client
  }, [props.client, props.type, props.config])

  const getApiGraphQLUrl = useCallback(() => {
    return global.RWJS_API_GRAPHQL_URL
  }, [])

  /**
   * Clients should always return null or token string.
   * It is expected that they catch any errors internally.
   * This catch is a last resort effort in case any errors are
   * missed or slip through.
   */
  const getToken = useCallback(async () => {
    try {
      return (await rwClientPromise).getToken()
    } catch {
      return null
    }
  }, [rwClientPromise])

  const getCurrentUser = useCallback(async (): Promise<
    Record<string, unknown>
  > => {
    const client = await rwClientPromise
    // Always get a fresh token, rather than use the one in state
    const token = await getToken()
    const response = await global.fetch(getApiGraphQLUrl(), {
      method: 'POST',
      // TODO: how can user configure this? inherit same `config` options given to auth client?
      credentials: 'include',
      headers: {
        'content-type': 'application/json',
        'auth-provider': client.type,
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
  }, [rwClientPromise, getToken, getApiGraphQLUrl])

  const reauthenticate = useCallback(async () => {
    const client = await rwClientPromise
    const notAuthenticatedState: AuthProviderState = {
      isAuthenticated: false,
      currentUser: null,
      userMetadata: null,
      loading: false,
      hasError: false,
    }

    try {
      const userMetadata = await client.getUserMetadata()
      if (!userMetadata) {
        setAuthProviderState(notAuthenticatedState)
      } else {
        await getToken()

        const currentUser = skipFetchCurrentUser ? null : await getCurrentUser()

        setAuthProviderState((oldState) => ({
          ...oldState,
          userMetadata,
          currentUser,
          isAuthenticated: true,
          loading: false,
        }))
      }
    } catch (e: any) {
      setAuthProviderState({
        ...notAuthenticatedState,
        hasError: true,
        error: e as Error,
      })
    }
  }, [
    getToken,
    rwClientPromise,
    setAuthProviderState,
    skipFetchCurrentUser,
    getCurrentUser,
  ])

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
  const hasRole = useCallback(
    (rolesToCheck: string | string[]): boolean => {
      const currentUser = authProviderState.currentUser

      if (currentUser?.roles) {
        if (typeof rolesToCheck === 'string') {
          if (typeof currentUser.roles === 'string') {
            // rolesToCheck is a string, currentUser.roles is a string
            return currentUser.roles === rolesToCheck
          } else if (Array.isArray(currentUser.roles)) {
            // rolesToCheck is a string, currentUser.roles is an array
            return currentUser.roles?.some(
              (allowedRole) => rolesToCheck === allowedRole
            )
          }
        }

        if (Array.isArray(rolesToCheck)) {
          if (Array.isArray(currentUser.roles)) {
            // rolesToCheck is an array, currentUser.roles is an array
            return currentUser.roles?.some((allowedRole) =>
              rolesToCheck.includes(allowedRole)
            )
          } else if (typeof currentUser.roles === 'string') {
            // rolesToCheck is an array, currentUser.roles is a string
            return rolesToCheck.some(
              (allowedRole) => currentUser?.roles === allowedRole
            )
          }
        }
      }

      return false
    },
    [authProviderState.currentUser]
  )

  const logIn = useCallback(
    async (options?: any) => {
      setAuthProviderState(defaultAuthProviderState)
      const client = await rwClientPromise
      const loginOutput = await client.login(options)
      await reauthenticate()

      return loginOutput
    },
    [rwClientPromise, reauthenticate]
  )

  const logOut = useCallback(
    async (options?: any) => {
      const client = await rwClientPromise
      await client.logout(options)
      setAuthProviderState({
        userMetadata: null,
        currentUser: null,
        isAuthenticated: false,
        hasError: false,
        error: undefined,
        loading: false,
      })
    },
    [rwClientPromise]
  )

  const signUp = useCallback(
    async (options?: any) => {
      const client = await rwClientPromise
      const signupOutput = await client.signup(options)
      await reauthenticate()
      return signupOutput
    },
    [rwClientPromise, reauthenticate]
  )

  const forgotPassword = useCallback(
    async (username: string) => {
      const client = await rwClientPromise

      if (client.forgotPassword) {
        return await client.forgotPassword(username)
      } else {
        throw new Error(
          `Auth client ${client.type} does not implement this function`
        )
      }
    },
    [rwClientPromise]
  )

  const resetPassword = useCallback(
    async (options?: any) => {
      const client = await rwClientPromise

      if (client.resetPassword) {
        return await client.resetPassword(options)
      } else {
        throw new Error(
          `Auth client ${client.type} does not implement this function`
        )
      }
    },
    [rwClientPromise]
  )

  const validateResetToken = useCallback(
    async (resetToken: string | null) => {
      const client = await rwClientPromise

      if (client.validateResetToken) {
        return await client.validateResetToken(resetToken)
      } else {
        throw new Error(
          `Auth client ${client.type} does not implement this function`
        )
      }
    },
    [rwClientPromise]
  )

  /** Whenever the rwClient is ready to go, restore auth and reauthenticate */
  useEffect(() => {
    if (rwClient && !hasRestoredState) {
      setHasRestoredState(true)

      const doRestoreState = async () => {
        await rwClient.restoreAuthState?.()
        reauthenticate()
      }

      doRestoreState()
    }
  }, [rwClient, reauthenticate, hasRestoredState])

  const { client, type, children } = props

  return (
    <AuthContext.Provider
      value={{
        ...authProviderState,
        logIn,
        logOut,
        signUp,
        getToken,
        getCurrentUser,
        hasRole,
        reauthenticate,
        forgotPassword,
        resetPassword,
        validateResetToken,
        client,
        type: type as SupportedAuthTypes,
      }}
    >
      {children}
      {rwClient && isAuthClientWithUpdateHook(rwClient) && (
        <AuthUpdateListener
          rwClient={rwClient}
          reauthenticate={reauthenticate}
        />
      )}
    </AuthContext.Provider>
  )
}
