import React, { ReactNode, useEffect, useState } from 'react'

import { AuthImplementation } from 'src/authImplementations/AuthImplementation'

import { AuthContextInterface, CurrentUser } from '../AuthContext'

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

export interface AuthProviderProps {
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
  TValidateResetToken
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
    TValidateResetToken
  >,
  customProviderHooks?: {
    useCurrentUser?: () => Promise<Record<string, unknown>>
    useHasRole?: (
      currentUser: CurrentUser | null
    ) => (rolesToCheck: string | string[]) => boolean
  }
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
    children,
    skipFetchCurrentUser,
  }: AuthProviderProps) => {
    // const [hasRestoredState, setHasRestoredState] = useState(false)

    const [authProviderState, setAuthProviderState] = useState<
      AuthProviderState<TUser>
    >(defaultAuthProviderState)

    const getToken = useToken(authImplementation)

    // We're disabling eslint here, because while yes, technically we are
    // conditionally calling a hook, which you're not allowed to do. But in
    // practice a customProviderHook is either always going to be supplied,
    // or never
    const getCurrentUser = customProviderHooks?.useCurrentUser
      ? customProviderHooks.useCurrentUser
      : // eslint-disable-next-line react-hooks/rules-of-hooks
        useCurrentUser(authImplementation)

    console.log('AuthProvider getCurrentUser', getCurrentUser)

    const reauthenticate = useReauthenticate(
      authImplementation,
      setAuthProviderState,
      skipFetchCurrentUser
    )

    const hasRole = customProviderHooks?.useHasRole
      ? customProviderHooks.useHasRole(authProviderState.currentUser)
      : // eslint-disable-next-line react-hooks/rules-of-hooks
        useHasRole(authProviderState.currentUser)
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
    const type = authImplementation.type

    // Whenever the authImplementation is ready to go, restore auth and reauthenticate
    // TODO: We need this for Clerk. Need to figure out how to incorporate
    //       Also need this for all other auth clients that implement `restoreAuthState`
    useEffect(() => {
      async function doRestoreState() {
        await authImplementation.restoreAuthState?.()
        reauthenticate()
      }

      if (authImplementation /* && !hasRestoredState*/) {
        // setHasRestoredState(true)

        doRestoreState()
      }
    }, [reauthenticate])

    authImplementation.useListenForUpdates?.({ reauthenticate })

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
      </AuthContext.Provider>
    )
  }

  return AuthProvider
}
