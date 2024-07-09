import type { ViteDevServer } from 'vite'

import type { RWRouteManifestItem } from '@redwoodjs/internal/dist/routes.js'

import type { MiddlewareRequest } from './MiddlewareRequest.js'
import type { MiddlewareResponse } from './MiddlewareResponse.js'

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
