export interface RWRouteManifestItem {
  matchRegexString: string | null
  routeHooks: string | null
  bundle: string | null
  routePath: RoutePath
  name: string
}

export type RWRouteManifest = Record<RoutePath, RWRouteManifestItem>

type RoutePath = string
