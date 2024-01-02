import { useRouterState } from './router-context'
import type { GeneratedRoutesMap } from './util'

import type { AvailableRoutes } from '.'

// This has to be a function, otherwise we're not able to do declaration merging
export function useRoutePaths() {
  const routerState = useRouterState()

  const routePaths = Object.values(routerState.routes.pathRouteMap).reduce<
    Record<keyof GeneratedRoutesMap, string>
  >((routePathsAcc, currRoute) => {
    if (currRoute.name) {
      routePathsAcc[currRoute.name] = currRoute.path
    }

    return routePathsAcc
  }, {})

  return routePaths
}

export function useRoutePath(routeName: keyof AvailableRoutes) {
  const routePaths = useRoutePaths()

  return routePaths[routeName]
}
