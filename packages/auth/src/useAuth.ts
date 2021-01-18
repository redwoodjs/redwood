import React from 'react'

import type { AuthContextInterface } from './AuthProvider'
import { AuthContext } from './AuthProvider'

export const useAuth = (): AuthContextInterface => {
  return React.useContext(AuthContext) as AuthContextInterface
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace NodeJS {
    interface Global {
      __REDWOOD__USE_AUTH: () => AuthContextInterface
      __REDWOOD__API_PROXY_PATH: string
    }
  }
}
