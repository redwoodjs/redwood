import type { ReactNode } from 'react'
import React from 'react'

import type { AuthProviderState } from './AuthProviderState'
import { defaultAuthProviderState } from './AuthProviderState'

export type ServerAuthState = AuthProviderState<never> & {
  // Used by AuthProvider in getToken. We can probably remove this
  encryptedSession?: string | null
  cookieHeader?: string
}

/**
 * On the server, it resolve to the defaultAuthProviderState first
 */
export const ServerAuthContext = React.createContext<ServerAuthState>(
  globalThis?.__REDWOOD__SERVER__AUTH_STATE__ || {
    ...defaultAuthProviderState,
    encryptedSession: null,
  }
)

/***
 * Note: This only gets rendered on the server and serves two purposes:
 * 1) On the server, it sets the auth state
 * 2) On the client, it restores the auth state from the initial server render
 */
export const ServerAuthProvider = ({
  value,
  children,
}: {
  value: ServerAuthState
  children?: ReactNode[]
}) => {
  // @NOTE: we "Sanitize" to remove encryptedSession and cookieHeader
  // not totally necessary, but it's nice to not have them in the DOM
  // @MARK: needs discussion!
  const stringifiedAuthState = `__REDWOOD__SERVER__AUTH_STATE__ = ${JSON.stringify(
    sanitizeServerAuthState(value)
  )};`

  return (
    <>
      <script
        id="__REDWOOD__SERVER_AUTH_STATE__"
        dangerouslySetInnerHTML={{
          __html: stringifiedAuthState,
        }}
      />

      <ServerAuthContext.Provider value={value}>
        {children}
      </ServerAuthContext.Provider>
    </>
  )
}
function sanitizeServerAuthState(value: ServerAuthState) {
  const sanitizedState = { ...value }
  delete sanitizedState.encryptedSession && delete sanitizedState.cookieHeader
  return sanitizedState
}
