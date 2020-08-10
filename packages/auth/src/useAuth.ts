import React from 'react'

import type { AuthContextInterface } from './AuthProvider'
import { AuthContext } from './AuthProvider'

export const useAuth = (): AuthContextInterface => {
  return React.useContext(AuthContext) as AuthContextInterface
}

declare global {
  interface Window {
    /**
     * Global reference to @redwoodjs/auth's `useAuth` hook for zero-config authentication.
     * This is used as the default value for `useAuth` in @redwoodjs/router's `Router`,
     * and @redwoodjs/web's `RedwoodProvider` so that the user no longer has to pass
     * in the value.
     */
    __REDWOOD__USE_AUTH: () => AuthContextInterface
    __REDWOOD__API_PROXY_PATH: string
  }
}

window.__REDWOOD__USE_AUTH = useAuth
