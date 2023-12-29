import { useRouterState } from './router-context'

import { routes } from '.'
import type { AvailableRoutes } from '.'

// This needs to be a function so that we can use codegen to provide better
// types in a user's project (see web-routerRoutes.d.ts)
/** Gets the name of the current route (as defined in your Routes file) */
export function useRouteName() {
  const routerState = useRouterState()
  const routeName = routerState.activeRouteName

  if (isAvailableRouteName(routeName)) {
    return routeName
  }

  return undefined
}

function isAvailableRouteName(name: unknown): name is keyof AvailableRoutes {
  return typeof name === 'string' && Object.keys(routes).includes(name)
}
