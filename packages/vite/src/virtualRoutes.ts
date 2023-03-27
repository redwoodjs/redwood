import path from 'path'

import fg from 'fast-glob'

// @MARK we should avoid using structure
import { listRoutes } from '@redwoodjs/internal/dist/routes'

export const getRouteHookForPage = (pagePath: string | undefined | null) => {
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
