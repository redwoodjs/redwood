import path from 'path'

import fg from 'fast-glob'

import { getPaths } from '@redwoodjs/internal/dist/paths'
import { getRouteRegexAndParams } from '@redwoodjs/router'
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

// @NOTE:
// We pass the matchRegex as string, because serializing/deserializing a regex is a pain
export interface VirtualRoute {
  name: string
  path: string
  hasParams: boolean
  id: string
  isNotFound: boolean
  filePath: string | undefined
  relativeFilePath: string | undefined
  routeHooks: string | undefined | null
  matchRegexString: string | null
}

export const listRoutes = (): VirtualRoute[] => {
  const rwProject = getProject(getPaths().base)
  const routes = rwProject.getRouter().routes

  return routes.map((route: any) => {
    return {
      name: route.isNotFound ? '404' : route.name,
      path: route.isNotFound ? '/404' : route.path,
      hasParams: route.hasParameters,
      id: route.id,
      isNotFound: route.isNotFound,
      filePath: route.page?.filePath,
      relativeFilePath: route.page?.filePath
        ? path.relative(getPaths().web.src, route.page?.filePath)
        : undefined,
      routeHooks: getRouteHookForPage(route.page?.filePath),
      matchRegexString: route.isNotFound
        ? null
        : getRouteRegexAndParams(route.path).matchRegexString,
    }
  })
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
