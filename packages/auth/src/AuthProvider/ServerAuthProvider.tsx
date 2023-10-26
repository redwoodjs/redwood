import React from 'react'

import type { AuthProviderState } from './AuthProviderState'
import { defaultAuthProviderState } from './AuthProviderState'

export const ServerAuthContext = React.createContext<
  AuthProviderState<never> & { token: string | null }
>({ ...defaultAuthProviderState, token: null })

export const ServerAuthProvider = ServerAuthContext.Provider
