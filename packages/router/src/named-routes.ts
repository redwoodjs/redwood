import * as React from 'react'

import { validatePath, replaceParams, RouteProps } from './internal'

// The first time the routes are loaded, iterate through them and create the named
// route functions.

const namedRoutes: Record<string, {}> = {}
let namedRoutesDone = false

const mapNamedRoutes = (routes: React.ReactElement<RouteProps>[]) => {
  if (namedRoutesDone) {
    return
  }
  for (const route of routes) {
    const { path, name, notfound } = route.props

    // Skip the notfound route.
    if (notfound) {
      continue
    }

    // Check for issues with the path.
    validatePath(path)

    // Create the named route function for this route.
    namedRoutes[name] = (args = {}) => replaceParams(path, args)
  }

  // Only need to do this once.
  namedRoutesDone = true
}

const routes = namedRoutes

export { routes, mapNamedRoutes }
