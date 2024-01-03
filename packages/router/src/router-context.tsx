import React, { createContext, useContext, useMemo } from 'react'

import type { AuthContextInterface } from '@redwoodjs/auth'
import { useNoAuth } from '@redwoodjs/auth'

import type { ParamType } from './util'

type UseAuth = () => AuthContextInterface<
  unknown,
  unknown,
  unknown,
  unknown,
  unknown,
  unknown,
  unknown,
  unknown,
  unknown,
  unknown,
  unknown,
  unknown
>

export interface RouterState {
  paramTypes?: Record<string, ParamType>
  useAuth: UseAuth
}

const RouterStateContext = createContext<RouterState | undefined>(undefined)

export interface RouterContextProviderProps
  extends Omit<RouterState, 'useAuth'> {
  useAuth?: UseAuth
  children: React.ReactNode
}

export const RouterContextProvider: React.FC<RouterContextProviderProps> = ({
  useAuth,
  paramTypes,
  children,
}) => {
  const state = useMemo(
    () => ({
      useAuth: useAuth || useNoAuth,
      paramTypes,
    }),
    [useAuth, paramTypes]
  )

  return (
    <RouterStateContext.Provider value={state}>
      {children}
    </RouterStateContext.Provider>
  )
}

export const useRouterState = () => {
  const context = useContext(RouterStateContext)

  if (context === undefined) {
    throw new Error(
      'useRouterState must be used within a RouterContextProvider'
    )
  }

  return context
}
