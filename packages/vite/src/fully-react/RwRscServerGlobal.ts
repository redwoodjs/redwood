import { lazy } from 'react'

// import { createModuleMapProxy, setupWebpackEnv } from './webpack'

// Create a map of routes by parentId to use recursively instead of
// repeatedly filtering the manifest.
// export function groupRoutesByParentId(
//   /** @type {import('types').RouteManifest} */
//   manifest
// ) {
//   /** @type {Record<string, import('types').RouteManifest[string][]>} */
//   const routes = {}

//   Object.values(manifest).forEach((route) => {
//     const parentId = route.parentId || ''
//     if (!routes[parentId]) {
//       routes[parentId] = []
//     }
//     routes[parentId].push(route)
//   })

//   return routes
// }

// const isServer = typeof window === 'undefined'

// export function createNestedPageRoutes(
//   env: RwRscServerGlobal,
//   parentId = '',
//   routesByParentId = groupRoutesByParentId(env.routeManifest || {}),
//   routerMode: string
// ) {
//   return (routesByParentId[parentId] || [])
//     .map((route: any) => {
//       if (route.type === 'route') {
//         return undefined
//       }

//       const path =
//         (route.path?.length ?? 0) > 0 && route.path?.endsWith('/')
//           ? route.path.slice(0, -1)
//           : route.path

//       const dataRoute = {
//         id: route.id,
//         path,
//         caseSensitive: route.caseSensitive,
//         /** @type {any[] | undefined} */
//         children: undefined,
//         index: route.index,
//         file: route.file,
//         component:
//           typeof route.file === 'string'
//             ? isServer
//               ? routerMode === 'client'
//                 ? (props: any) => {
//                     const Component = useMemo(
//                       () => env.lazyComponent(route.file),
//                       []
//                     )
//                     return createElement(Component, props)
//                   }
//                 : (props: any) => {
//                     const Component = env.lazyComponent(route.file)
//                     return createElement(Component, props)
//                   }
//               : env.lazyComponent(route.file)
//             : lazy(route.file),
//       }

//       const children = createNestedPageRoutes(
//         env,
//         route.id,
//         routesByParentId,
//         routerMode
//       )
//       if (children.length > 0) {
//         dataRoute.children = children
//       }
//       return dataRoute
//     })
//     .filter(Boolean)
// }

export class RwRscServerGlobal {
  // clientModuleMap = createModuleMapProxy()

  /** @type {import('types').RouteManifest} */
  routeManifest

  constructor() {
    this.routeManifest = {}
  }

  /**
   * @return {string | undefined}
   */
  bootstrapScriptContent() {
    throw new Error('Not implemented')
  }

  /**
   * @return {string[]}
   */
  bootstrapModules() {
    throw new Error('Not implemented')
  }

  // setupWebpackEnv() {
  //   setupWebpackEnv(this.loadModule.bind(this))
  // }

  // getRouteHandlers() {
  //   return Object.fromEntries(
  //     Object.entries(this.routeManifest).filter(
  //       ([_key, value]) => value.type === 'route'
  //     )
  //   )
  // }

  /** @return {React.FC<any>} */
  notFoundComponent() {
    throw new Error('Method not implemented.')
  }

  // /**
  //  * @return {[import('../fs-router/path').Location, import('../fs-router/utils').RouteMatch[] | null]}
  //  */
  // matchRoutes(url: string) {
  //   const basename = '/'
  //   const location = createLocation(
  //     '',
  //     createPath(new URL(url)),
  //     null,
  //     'default'
  //   )
  //   return [location, matchRoutes(this.pageRoutes(), location, basename)]
  // }

  // pageRoutes() {
  //   const pageRoutes = createNestedPageRoutes(
  //     this,
  //     'root',
  //     undefined,
  //     import.meta.env.ROUTER_MODE
  //   )

  //   return pageRoutes
  // }

  async loadModule(id: string) {
    return await import(/* @vite-ignore */ id)
  }

  lazyComponent(id: string) {
    return lazy(() => this.loadModule(id))
  }

  // Will be implemented by subclasses
  async findAssets(_id: string): Promise<any[]> {
    return []
  }

  getDependenciesForURL(_route: string): string[] {
    return []
    // const inputs: string[] =
    //   matchRoutes(this.pageRoutes(), '/')?.map((r) => {
    //     if (!r.route?.file) {
    //       /** @type {any} */
    //       const a = undefined
    //       return a
    //     }
    //     return relative(import.meta.env.ROOT_DIR, r.route?.file)
    //   }) ?? []

    // inputs.push(
    //   relative(import.meta.env.ROOT_DIR, import.meta.env.APP_ROOT_ENTRY)
    // )

    // return inputs
  }
}
