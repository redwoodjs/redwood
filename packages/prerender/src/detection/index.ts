import { getPaths } from '@redwoodjs/internal/dist/paths'
import { RedwoodProject } from '@redwoodjs/skeleton'
import type { RedwoodRoute } from '@redwoodjs/skeleton'

export const detectPrerenderRoutes = () => {
  const rwProject = RedwoodProject.getProject({
    pathWithinProject: getPaths().base,
  })
  // Assumes only one router exists and that its the one we want
  const routes = rwProject.getRouters()[0].routes

  const prerenderRoutes = routes
    .filter((route: RedwoodRoute) => route.prerender) // only select routes with prerender prop
    .map((route: RedwoodRoute) => ({
      name: route.isNotFound ? '404' : route.name,
      // `path` will be updated/expanded later where route parameters will be
      // replaced with actual values
      path: route.isNotFound ? '/404' : route.path,
      // `routePath` is always the path specified on the <Route> component
      // (or the special /404 path)
      routePath: route.isNotFound ? '/404' : route.path,
      hasParams: route.hasParameters,
      isNotFound: route.isNotFound,
      filePath: route.getPage()?.filepath,
    }))

  return prerenderRoutes
}
