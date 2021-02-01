import { validatePath, replaceParams } from './internal'

// The first time the routes are loaded, iterate through them and create the named
// route functions.

const namedRoutes: Record<
  string,
  (args?: Record<string, string>) => string
> = {}
let namedRoutesDone = false

export const resetNamedRoutes = () => {
  namedRoutesDone = false
}

const mapNamedRoutes = (routes: React.ReactElement[]) => {
  if (namedRoutesDone) {
    return namedRoutes
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

  return namedRoutes
}

const routes = namedRoutes

export { routes, mapNamedRoutes }
