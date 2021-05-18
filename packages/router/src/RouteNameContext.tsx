import { useContext } from 'react'

import { createNamedContext } from './util'

export interface RouteNameContextInterface {
  routeName?: string
}

const RouteNameContext =
  createNamedContext<RouteNameContextInterface>('RouteName')

export const RouteNameProvider = RouteNameContext.Provider

export const useRouteName = () => {
  const context = useContext(RouteNameContext)

  if (context === undefined) {
    throw new Error('useRouteName must be used within a RouteNameContext')
  }

  return context
}
