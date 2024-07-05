import type { ViteDevServer } from 'vite'

import type { RWRouteManifestItem } from '@redwoodjs/internal/dist/routes'
import type { MiddlewareRequest } from '@redwoodjs/web/dist/server/MiddlewareRequest.js'
import type { MiddlewareResponse } from '@redwoodjs/web/dist/server/MiddlewareResponse.js'

export type Middleware = (
  req: MiddlewareRequest,
  res: MiddlewareResponse,
  options?: MiddlewareInvokeOptions,
) => Promise<MiddlewareResponse> | MiddlewareResponse | void

export interface MiddlewareClass {
  invoke: Middleware
}

export type MiddlewareInvokeOptions = {
  route?: RWRouteManifestItem
  cssPaths?: Array<string>
  params?: Record<string, unknown>
  viteDevServer?: ViteDevServer
}

// Tuple of [mw, '*.{extension}']
export type MiddlewareReg = Array<
  [Middleware | MiddlewareClass, string] | Middleware | MiddlewareClass
>
