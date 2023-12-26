import { useRouterState } from './router-context'
import type { GeneratedRoutesMap } from './util'

import type { AvailableRoutes } from '.'

export const useRoutePaths = () => {
  const routerState = useRouterState()

  const routePaths = Object.values(routerState.routes.pathRouteMap).reduce<
    Record<keyof GeneratedRoutesMap, string>
  >((routePaths, route) => {
    if (route.name) {
      routePaths[route.name] = route.path
    }

    return routePaths
  }, {})

  return routePaths as Record<keyof AvailableRoutes, string>
}

export const useRoutePath = (routeName: keyof AvailableRoutes) => {
  const routePaths = useRoutePaths()

  return routePaths[routeName]
}
