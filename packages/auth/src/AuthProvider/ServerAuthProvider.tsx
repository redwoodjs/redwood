import React from 'react'

import type { AuthProviderState } from './AuthProviderState'
import { defaultAuthProviderState } from './AuthProviderState'

export const ServerAuthContext = React.createContext<
  AuthProviderState<never> & {
    encryptedSession: string | null
    cookieHeader?: string
  }
>({ ...defaultAuthProviderState, encryptedSession: null })

export const ServerAuthProvider = ServerAuthContext.Provider
