import { useCallback, useEffect, useMemo, useState } from 'react'

// import { createAuthClient } from './authClients'
import type {
  AuthClient,
  SupportedAuthTypes,
  // SupportedAuthConfig,
  SupportedAuthClients,
  // SupportedUserMetadata,
} from './authClients'

export interface CurrentUser {
  roles?: Array<string> | string
}

interface AuthProviderState {
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

export const useAuthService = (
  authClient: SupportedAuthClients,
  options = {} as { skipFetchCurrentUser: boolean; type: string; config: any }
) => {
  const skipFetchCurrentUser = options?.skipFetchCurrentUser || false

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

    // const client = await createAuthClient(
    //   authClient as SupportedAuthClients,
    //   options.type as SupportedAuthTypes,
    //   options.config as SupportedAuthConfig
    // )

    setRwClient(authClient)

    return authClient
  }, [authClient])

  /**
   * Clients should always return null or token string.
   * It is expected that they catch any errors internally.
   * This catch is a last resort effort in case any errors are
   * missed or slip through.
   */
  const getToken = useCallback(async () => {
    const client = await rwClientPromise

    try {
      const token = await client.getToken()
      return token
    } catch (e) {
      console.error('Caught internal:', e)
      return null
    }
  }, [rwClientPromise])

  const getCurrentUser = useCallback(async (): Promise<
    Record<string, unknown>
  > => {
    const client = await rwClientPromise
    // Always get a fresh token, rather than use the one in state
    const token = await getToken()
    const response = await global.fetch(global.RWJS_API_GRAPHQL_URL, {
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
  }, [rwClientPromise, getToken])

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

  const { type } = options

  return {
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
    client: authClient,
    type: type as SupportedAuthTypes,
    rwClient,
  }
}
