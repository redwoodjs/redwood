import type { ReactNode } from 'react'
import React from 'react'

import type { AuthProviderState } from './AuthProviderState.js'
import { middlewareDefaultAuthProviderState } from './AuthProviderState.js'

export type ServerAuthState = AuthProviderState<never> & {
  cookieHeader?: string
}

const getAuthInitialStateFromServer = () => {
  if (globalThis?.__REDWOOD__SERVER__AUTH_STATE__) {
    const initialState = {
      ...middlewareDefaultAuthProviderState,
      encryptedSession: null,
      ...(globalThis?.__REDWOOD__SERVER__AUTH_STATE__ || {}),
    }
    // Clear it so we don't accidentally use it again
    globalThis.__REDWOOD__SERVER__AUTH_STATE__ = null
    return initialState
  }

  // Already restored
  return null
}

/**
 * On the server, it resolves to the middlewareDefaultAuthProviderState first.
 *
 * On the client it restores from the initial server state injected in the ServerAuthProvider
 */
export const ServerAuthContext = React.createContext<ServerAuthState>(
  getAuthInitialStateFromServer(),
)

/**
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
  // @NOTE: we "Sanitize" to remove cookieHeader
  // not totally necessary, but it's nice to not have them in the DOM
  // @MARK: needs discussion!
  const stringifiedAuthState = `__REDWOOD__SERVER__AUTH_STATE__ = ${JSON.stringify(
    sanitizeServerAuthState(value),
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
  // Remove the cookie from being printed onto the DOM
  // harmless, but still...
  delete sanitizedState.cookieHeader

  return sanitizedState
}
