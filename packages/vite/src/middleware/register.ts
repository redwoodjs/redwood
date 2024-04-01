import fmw from 'find-my-way'
import type { ViteDevServer } from 'vite'

import { getPaths } from '@redwoodjs/project-config'

import type { Middleware, MiddlewareInvokeOptions } from './invokeMiddleware'
import type { MiddlewareRequest } from './MiddlewareRequest'
import { MiddlewareResponse } from './MiddlewareResponse'

// Tuple of [mw, '*.{extension}']
export type MiddlewareReg = Array<[Middleware, string] | Middleware>

type GroupedMw = Record<string, Middleware[]>

export const groupByRoutePatterns = (mwRegList: MiddlewareReg) => {
  const grouped: GroupedMw = {}

  mwRegList.forEach((mwReg) => {
    if (Array.isArray(mwReg)) {
      const [mw, pattern = '*'] = mwReg
      if (!grouped[pattern]) {
        grouped[pattern] = []
      }

      grouped[pattern].push(mw)
    } else {
      if (typeof mwReg !== 'function') {
        console.error('Received as middleware: ', mwReg)
        throw new Error(
          'Please check the return on registerMiddleware. Must be a Middleware function or tuple of [Middleware, string]',
        )
      }
      grouped['*'] = [...(grouped['*'] || []), mwReg]
    }
  })

  return grouped
}

/**
 * Takes an array of middleware, and returns a single middleware function
 * that chains them together, by passing the output of one to the next.
 * @param groupedMw
 */
export const chain = (mwList: Middleware[]) => {
  return async (
    req: MiddlewareRequest,
    res: MiddlewareResponse,
    options: MiddlewareInvokeOptions,
  ) => {
    let response = res
    for (const mw of mwList) {
      response = (await mw(req, response, options)) || MiddlewareResponse.next()
    }

    return response
  }
}

export const addMiddlewareHandlers = (mwRegList: MiddlewareReg | undefined) => {
  if (!mwRegList) {
    return undefined
  }

  const groupedMw = groupByRoutePatterns(mwRegList)
  const mwRouter = fmw()

  for (const pattern in groupedMw) {
    const mwList = groupedMw[pattern]
    const chainedMw = chain(mwList)

    // @NOTE: as any, because we don't actually use the fmw router to invoke the mw
    // we use it just for matching. FMW doesn't seem to have a way of customising the handler signature
    mwRouter.on('GET', pattern, chainedMw as any)
  }

  return mwRouter
}

/**
 * If you pass in the vite dev server, we're running in development
 * @param vite
 * @returns Middleware find-my-way Router
 */
export const createMiddlewareRouter = async (vite?: ViteDevServer) => {
  const rwPaths = getPaths()

  const entryServerPath = rwPaths.web.entryServer

  if (!entryServerPath) {
    throw new Error('Entry server not found. Could not load middleware')
  }

  let entryServerImport: Record<'registerMiddleware', () => MiddlewareReg>
  if (vite) {
    entryServerImport = await vite.ssrLoadModule(entryServerPath)
  } else {
    entryServerImport = await import(entryServerPath)
  }

  const { registerMiddleware } = entryServerImport
  return addMiddlewareHandlers(registerMiddleware?.())
}
