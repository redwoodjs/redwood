import React from 'react'

// Exporting everything here, but exports further down in this file will
// override exports with the same name
export * from '@redwoodjs/auth/dist/index'

import { mockedUserMeta } from './mockRequests'

interface Props {
  children: React.ReactNode
}

const AuthProvider: React.FC<Props> = ({ children }) => {
  return <>{children}</>
}

export function useAuth() {
  return {
    loading: false,
    isAuthenticated: !!mockedUserMeta.currentUser,
    logIn: async () => {},
    logOut: async () => {},
    signUp: async () => {},
    currentUser: mockedUserMeta.currentUser,
    userMetadata: mockedUserMeta.currentUser,
    getToken: async () => null,
    getCurrentUser: async () => mockedUserMeta.currentUser,
    hasRole: () => false,
    reauthenticate: async () => {},
    forgotPassword: async () => {},
    resetPassword: async () => {},
    validateResetToken: async () => {},
    type: 'default',
    client: undefined,
    hasError: false,
  }
}

export const createAuthentication = () => {
  return { AuthProvider, useAuth }
}
