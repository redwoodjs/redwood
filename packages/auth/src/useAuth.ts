import React from 'react'

import { AuthContext } from './AuthProvider'
import type { AuthContextInterface } from './AuthProvider'

export const useAuth = (): AuthContextInterface => {
  return React.useContext(AuthContext) as AuthContextInterface
}

global.__REDWOOD__USE_AUTH = useAuth