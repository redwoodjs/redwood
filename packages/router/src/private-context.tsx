import React, { createContext, useCallback, useContext } from 'react'

import { useRouterState } from './router-context'

/**
 * @param isPrivate - Always true for any children wrapped in a `<Private>`
 *                    component
 * @param unauthorized - Use this function to check if the user is allowed to
 *                       go to this route or not
 * @param unauthorized - Name of the route to go to if not authorized to visit
 *                       any of the routes in the containing `<Private>` block
 */
interface PrivateState {
  isPrivate: boolean
  unauthorized: (role?: string | string[]) => boolean
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

  const unauthorized = useCallback(() => {
    return !(isAuthenticated && (!role || hasRole(role)))
  }, [isAuthenticated, role, hasRole])

  return (
    <PrivateContext.Provider
      value={{ isPrivate, unauthorized, unauthenticated }}
    >
      {children}
    </PrivateContext.Provider>
  )
}

export const usePrivate = () => {
  const context = useContext(PrivateContext)
  const unauthorized = context ? context.unauthorized : () => true
  const unauthenticated = context ? context.unauthenticated : ''

  return {
    isPrivate: !!context?.isPrivate,
    unauthorized,
    unauthenticated
  }
}
