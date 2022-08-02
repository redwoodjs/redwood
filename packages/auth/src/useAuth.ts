import React from 'react'

import { AuthContext } from './AuthProvider'
import type { AuthContextInterface } from './AuthProvider'

export const useAuth = (provider?: string): AuthContextInterface => {
  const context = React.useContext(AuthContext) as any

  if (context?.services && provider !== undefined) {
    return context?.services[provider]
  }

  if (context?.services && provider === undefined) {
    const p = context.determineAuth(context.services)
    return context?.services[p]
  }

  return context
}

global.__REDWOOD__USE_AUTH = useAuth
