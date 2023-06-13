/**
 *
 * Sub+Superset of RouteSpec returned by getProjectRoutes()
 * in packages/internal/src/routes.ts
 *
 * Differences:
 * - has path to routeHook (which is not available until after build)
 * - bundle doesn't exist before build, comes from vite build manifest. Used in script injection
 *
 * **All** of these properties are used by the prod FE server
 */
export interface RWRouteManifestItem {
  matchRegexString: string | null // xAR, RouteSpec.matchRegexString
  routeHooks: string | null // xAR, RouteSpec.routeHooks BUT in RouteSpec its the src path, here its the dist path
  bundle: string | null // xAR, xRS
  pathDefinition: PathDefinition // <-- AnalyzedRoute.path, RouteSpec.path
  hasParams: boolean // xAR, RouteSpec.hasParams
  name: string // <-- AnalyzedRoute.name, RouteSpec.name
  redirect: { to: string; permanent: boolean } | null // xAR (not same type), RouteSpec.redirect
  renderMode: 'html' | 'stream' // x, RouteSpec.renderMode
}

export type RWRouteManifest = Record<PathDefinition, RWRouteManifestItem>

type PathDefinition = string
