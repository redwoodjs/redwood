// @ts-nocheck

import {
  RequestMiddleware,
  ModuleOverride,
} from 'node-request-interceptor/lib/glossary'
import { overrideXhrModule } from 'node-request-interceptor/lib/XMLHttpRequest/override'

export * from 'node-request-interceptor'

export class RequestInterceptor {
  private overrides: ReturnType<ModuleOverride>[]
  private middleware: RequestMiddleware[]

  constructor() {
    this.middleware = []

    this.overrides = [overrideXhrModule].map((override) =>
      override(this.applyMiddleware)
    )
  }

  /**
   * Restores original instances of patched modules.
   */
  public restore() {
    this.overrides.forEach((restore) => restore())
  }

  /**
   * Applies given middleware to any intercepted request.
   */
  public use(middleware: RequestMiddleware) {
    this.middleware.push(middleware)
  }

  private applyMiddleware: RequestMiddleware = async (req, ref) => {
    for (const middleware of this.middleware) {
      const res = await middleware(req, ref)

      if (res) {
        return res
      }
    }
  }
}
