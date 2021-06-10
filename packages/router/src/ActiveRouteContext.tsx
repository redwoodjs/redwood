import { useContext } from 'react'

import { createNamedContext } from './util'

export interface ActiveRouteContextInterface {
  activeRoute?: JSX.Element
}

const ActiveRouteContext =
  createNamedContext<ActiveRouteContextInterface>('ActiveRoute')

export const ActiveRouteProvider = ActiveRouteContext.Provider

export const useActiveRoute = () => {
  const context = useContext(ActiveRouteContext)

  if (context === undefined) {
    throw new Error('useActiveRoute must be used within a ActiveRouteContext')
  }

  return context.activeRoute
}
