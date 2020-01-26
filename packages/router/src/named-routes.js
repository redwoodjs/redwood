import { validatePath, replaceParams } from './internal'

// The first time the routes are loaded, iterate through them and create the named
// route functions.

let namedRoutes = {}
let namedRoutesDone = false

const mapNamedRoutes = (routes) => {
  if (namedRoutesDone) {
    return
  }
  for (let route of routes) {
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
