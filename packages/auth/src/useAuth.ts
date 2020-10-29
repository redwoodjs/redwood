import React from 'react'

import { AuthContext } from './AuthProvider'

export function useAuth() {
  return React.useContext(AuthContext)
}

declare global {
  interface Window {
    /**
     * Global reference to @redwoodjs/auth's `useAuth` hook for zero-config authentication.
     * This is used as the default value for `useAuth` in @redwoodjs/router's `Router`,
     * and @redwoodjs/web's `RedwoodProvider` so that the user no longer has to pass
     * in the value.
     */
    __REDWOOD__USE_AUTH: typeof useAuth
    __REDWOOD__API_PROXY_PATH: string
  }
}

window.__REDWOOD__USE_AUTH = useAuth
