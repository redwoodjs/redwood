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
import type { RWRouteManifestItem } from '@redwoodjs/internal'

export type RWRouteManifest = Record<PathDefinition, RWRouteManifestItem>

type PathDefinition = string
