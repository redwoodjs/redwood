import React, { createContext, useCallback, useContext } from 'react'

import { useRouterState } from './router-context'

export interface PrivateState {
  isPrivate: boolean
  allowRender: (role?: string | string[]) => boolean
  unauthenticated: string
}

const PrivateContext = createContext<PrivateState | undefined>(undefined)

interface ProviderProps {
  isPrivate: boolean
  role?: string | string[]
  unauthenticated: string
}
export const PrivateContextProvider: React.FC<ProviderProps> = ({
  children,
  isPrivate,
  role,
  unauthenticated,
}) => {
  const routerState = useRouterState()
  const { isAuthenticated, hasRole } = routerState.useAuth()

  const allowRender = useCallback(() => {
    return isAuthenticated && (!role || hasRole(role))
  }, [isAuthenticated, role, hasRole])

  return (
    <PrivateContext.Provider
      value={{ isPrivate, allowRender, unauthenticated }}
    >
      {children}
    </PrivateContext.Provider>
  )
}

export const usePrivate = () => {
  const context = useContext(PrivateContext)
  const allowRender = context ? context.allowRender : () => false
  const unauthenticated = context ? context.unauthenticated : ''

  return { isPrivate: !!context?.isPrivate, allowRender, unauthenticated }
}
