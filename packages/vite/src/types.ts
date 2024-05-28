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
import type { TagDescriptor } from '@redwoodjs/web'

import type { MiddlewareReg } from './middleware/types'

export type RWRouteManifest = Record<PathDefinition, RWRouteManifestItem>

type PathDefinition = string

export type SsrEntryType = React.FunctionComponent<{
  css: string[]
  meta: TagDescriptor[]
}>

// TODO (RSC): Rename this type
export type EntryServer =
  | {
      registerMiddleware?: () => Promise<MiddlewareReg> | MiddlewareReg
      ServerEntry: SsrEntryType
      default: never
    }
  | {
      registerMiddleware?: () => Promise<MiddlewareReg> | MiddlewareReg
      ServerEntry: never
      default: SsrEntryType
    }
