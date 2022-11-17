import React, { ReactNode, useEffect, useState } from 'react'

import { AuthContextInterface, CurrentUser } from '../AuthContext'
import type { AuthImplementation } from '../AuthImplementation'

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
  TValidateResetToken,
  TClient
>(
  AuthContext: React.Context<
    | AuthContextInterface<
        TUser,
        TLogIn,
        TLogOut,
        TSignUp,
        TForgotPassword,
        TResetPassword,
        TValidateResetToken,
        TClient
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
    TClient
  >,
  customProviderHooks?: {
    useCurrentUser?: () => Promise<Record<string, unknown>>
    useHasRole?: (
      currentUser: CurrentUser | null
    ) => (rolesToCheck: string | string[]) => boolean
  }
) {
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

    const reauthenticate = useReauthenticate(
      authImplementation,
      setAuthProviderState,
      getCurrentUser,
      skipFetchCurrentUser
    )

    const hasRole = customProviderHooks?.useHasRole
      ? customProviderHooks.useHasRole(authProviderState.currentUser)
      : // eslint-disable-next-line react-hooks/rules-of-hooks
        useHasRole(authProviderState.currentUser)
    const signUp = useSignUp(
      authImplementation,
      setAuthProviderState,
      getCurrentUser,
      skipFetchCurrentUser
    )
    const logIn = useLogIn(
      authImplementation,
      setAuthProviderState,
      getCurrentUser,
      skipFetchCurrentUser
    )
    const logOut = useLogOut(authImplementation, setAuthProviderState)
    const forgotPassword = useForgotPassword(authImplementation)
    const resetPassword = useResetPassword(authImplementation)
    const validateResetToken = useValidateResetToken(authImplementation)
    const type = authImplementation.type
    const client = authImplementation.client

    // Whenever the authImplementation is ready to go, restore auth and reauthenticate
    useEffect(() => {
      async function doRestoreState() {
        await authImplementation.restoreAuthState?.()
        reauthenticate()
      }

      doRestoreState()
    }, [reauthenticate])

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
          client,
          type,
        }}
      >
        {children}
      </AuthContext.Provider>
    )
  }

  return AuthProvider
}
