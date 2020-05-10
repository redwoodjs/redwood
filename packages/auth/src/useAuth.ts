import React from 'react'

import { AuthContext } from './AuthProvider'
import type { AuthContextInterface } from './AuthProvider'

export const useAuth = (): AuthContextInterface => {
  return React.useContext(AuthContext) as AuthContextInterface
}

declare global {
  interface Window {
    /**
     * Global reference to @redwoodjs/auth's `useAuth` hook for zero-config
     * authentication.
     * We use this as the default value for `useAuth` in @redwoodjs/router's `Router`,
     * and @redwoodjs/web's `RedwoodProvider` so that the user no longer has to pass
     * in the value.
     */
    __REDWOOD__USE_AUTH: () => AuthContextInterface
  }
}

window.__REDWOOD__USE_AUTH = useAuth
