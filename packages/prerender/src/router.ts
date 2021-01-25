import { getPaths } from '@redwoodjs/internal'
import { getProject } from '@redwoodjs/structure'

export const detectPrerenderRoutes = () => {
  const rwProject = getProject(getPaths().base)
  const routes = rwProject.getRouter().routes

  const prerenderRoutes = routes
    .filter((route) => !route.isNotFound) // ignore notFound page
    .filter((route) => !route.hasParameters) // ignore routes that take params
    .filter((route) => route.prerender) // only select routes with prerender prop
    .map((route) => ({
      name: route.name,
      path: route.path,
      hasParams: route.hasParameters,
      id: route.id,
      filePath: route.page?.filePath,
    }))

  return prerenderRoutes
}
