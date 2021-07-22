import { getPaths } from '@redwoodjs/internal'
import { getProject } from '@redwoodjs/structure'

export const detectPrerenderRoutes = () => {
  const rwProject = getProject(getPaths().base)
  const routes = rwProject.getRouter().routes

  const prerenderRoutes = routes
    .filter((route) => !route.hasParameters) // ignore routes that take params
    .filter((route) => route.prerender) // only select routes with prerender prop
    .map((route) => ({
      name: route.isNotFound ? '404' : route.name,
      path: route.isNotFound ? '/404' : route.path,
      hasParams: route.hasParameters,
      id: route.id,
      isNotFound: route.isNotFound,
      filePath: route.page?.filePath,
    }))

  return prerenderRoutes
}
