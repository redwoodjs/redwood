import React, { ReactNode, useState } from 'react'

import { AuthImplementation } from 'src/authImplementations/AuthImplementation'

import { AuthContextInterface } from '../AuthContext'

import {
  AuthProviderState,
  defaultAuthProviderState,
} from './AuthProviderState'
import { useCurrentUser } from './useCurrentUser'
import { useForgotPassword } from './useForgotPassword'
import { useHasRole } from './useHasRole'
import { useLogIn } from './useLogIn'
import { useLogOut } from './useLogOut'
import { useReauthenticate } from './useReauthenticate'
import { useResetPassword } from './useResetPassword'
import { useSignUp } from './useSignUp'
import { useToken } from './useToken'
import { useValidateResetToken } from './useValidateResetToken'

// interface ListenerOpts {
//   authImplementation?: AuthImplementation
//   reauthenticate: () => Promise<void>
// }

// const AuthUpdateListener = ({
//   authImplementation,
//   reauthenticate,
// }: ListenerOpts) => {
//   authImplementation?.useListenForUpdates?.({ reauthenticate })

//   return null
// }

type AuthProviderProps = {
  type: string
  skipFetchCurrentUser?: boolean
  children: ReactNode
}

export function createAuthProvider<
  TUser,
  TRestoreAuth,
  TLogIn,
  TLogOut,
  TSignUp,
  TForgotPassword,
  TResetPassword,
  TValidateResetToken,
  TVerifyOtp
>(
  AuthContext: React.Context<
    | AuthContextInterface<
        TUser,
        TLogIn,
        TLogOut,
        TSignUp,
        TForgotPassword,
        TResetPassword,
        TValidateResetToken
      >
    | undefined
  >,
  authImplementation: AuthImplementation<
    TUser,
    TRestoreAuth,
    TLogIn,
    TLogOut,
    TSignUp,
    TForgotPassword,
    TResetPassword,
    TValidateResetToken,
    TVerifyOtp
  >
) {
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
  const AuthProvider = ({
    type,
    children,
    skipFetchCurrentUser,
  }: AuthProviderProps) => {
    // const [hasRestoredState, setHasRestoredState] = useState(false)

    const [authProviderState, setAuthProviderState] = useState<
      AuthProviderState<TUser>
    >(defaultAuthProviderState)

    // const [authImplementation, setAuthImplementation] =
    //   useState<AuthImplementation>()

    // const rwClientPromise: Promise<AuthClient> = useMemo(async () => {
    //   // If ever we rebuild the rwClient, we need to re-restore the state.
    //   // This is not desired behavior, but may happen if for some reason the host app's
    //   // auth configuration changes mid-flight.
    //   setHasRestoredState(false)

    //   const rwClient = await createAuthClient(client, type, config)

    //   setRwClient(rwClient)

    //   return rwClient
    // }, [client, type, config])

    /**
     * Clients should always return null or token string.
     * It is expected that they catch any errors internally.
     * This catch is a last resort effort in case any errors are
     * missed or slip through.
     */
    const getToken = useToken(authImplementation)
    const getCurrentUser = useCurrentUser(authImplementation)
    const reauthenticate = useReauthenticate(
      authImplementation,
      setAuthProviderState,
      skipFetchCurrentUser
    )
    const hasRole = useHasRole(authProviderState.currentUser)
    const signUp = useSignUp(
      authImplementation,
      setAuthProviderState,
      skipFetchCurrentUser
    )
    const logIn = useLogIn(
      authImplementation,
      setAuthProviderState,
      skipFetchCurrentUser
    )
    const logOut = useLogOut(authImplementation, setAuthProviderState)
    const forgotPassword = useForgotPassword(authImplementation)
    const resetPassword = useResetPassword(authImplementation)
    const validateResetToken = useValidateResetToken(authImplementation)

    // Whenever the authImplementation is ready to go, restore auth and reauthenticate
    // TODO: We need this for Clerk. Need to figure out how to incorporate
    // useEffect(() => {
    //   if (authImplementation && !hasRestoredState) {
    //     setHasRestoredState(true)

    //     const doRestoreState = async () => {
    //       await authImplementation.restoreAuthState?.()
    //       reauthenticate()
    //     }

    //     doRestoreState()
    //   }
    // }, [authImplementation, reauthenticate, hasRestoredState])

    return (
      <AuthContext.Provider
        value={{
          ...authProviderState,
          signUp,
          logIn,
          logOut,
          getToken,
          getCurrentUser,
          hasRole,
          reauthenticate,
          forgotPassword,
          resetPassword,
          validateResetToken,
          // client,
          type,
        }}
      >
        {children}
        {/* <AuthUpdateListener
          authImplementation={authImplementation}
          reauthenticate={reauthenticate}
        /> */}
      </AuthContext.Provider>
    )
  }

  return AuthProvider
}
