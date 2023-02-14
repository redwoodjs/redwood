import path from 'path'

import fg from 'fast-glob'

import { getPaths } from '@redwoodjs/internal/dist/paths'
// @MARK we should avoid using structure
import { getProject } from '@redwoodjs/structure'

const getRouteHookForPage = (pagePath: string | undefined | null) => {
  if (!pagePath) {
    return null
  }

  return fg
    .sync('*.routeHooks.{js,ts,tsx,jsx}', {
      absolute: true,
      cwd: path.dirname(pagePath), // the page's folder
    })
    .at(0)
}

export const listRoutes = () => {
  const rwProject = getProject(getPaths().base)
  const routes = rwProject.getRouter().routes

  return routes.map((route: any) => ({
    name: route.isNotFound ? '404' : route.name,
    path: route.isNotFound ? '/404' : route.path,
    hasParams: route.hasParameters,
    id: route.id,
    isNotFound: route.isNotFound,
    filePath: route.page?.filePath,
    routeHooks: getRouteHookForPage(route.page?.filePath),
  }))
}

export default function virtualRoutes() {
  // @MARK this is the import specifier
  const virtualModuleId = 'virtual:rw-routes'
  const resolvedVirtualModuleId = '\0' + virtualModuleId

  return {
    name: 'vite-plugin-redwood-routes', // required, will show up in warnings and errors
    resolveId(id: string) {
      if (id === virtualModuleId) {
        return resolvedVirtualModuleId
      }

      return
    },
    load(id: string) {
      const myRoutes = listRoutes()

      // @MARK this can still be useful for SSR, where we don't want to bundle rwjs/internal and structure
      if (id === resolvedVirtualModuleId) {
        return `export const routes = ${JSON.stringify(
          myRoutes
        )}; export default routes;`
      }

      return
    },
  }
}
