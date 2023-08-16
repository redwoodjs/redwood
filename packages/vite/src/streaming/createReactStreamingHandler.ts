import path from 'path'

import type { Request, Response } from 'express'
import isbot from 'isbot'
import type { ViteDevServer } from 'vite'

import type { RWRouteManifestItem } from '@redwoodjs/internal'
import { getAppRouteHook, getPaths } from '@redwoodjs/project-config'
import type { TagDescriptor } from '@redwoodjs/web'

// import { stripQueryStringAndHashFromPath } from '../utils'

import { reactRenderToStream } from './streamHelpers'
import { loadAndRunRouteHooks } from './triggerRouteHooks'

interface CreateReactStreamingHandlerOptions {
  route: RWRouteManifestItem
  clientEntryPath: string
  cssLinks: string[]
}

const checkUaForSeoCrawler = isbot.spawn()
checkUaForSeoCrawler.exclude(['chrome-lighthouse'])

export const createReactStreamingHandler = async (
  { route, clientEntryPath, cssLinks }: CreateReactStreamingHandlerOptions,
  viteDevServer?: ViteDevServer
) => {
  const { redirect, routeHooks, bundle } = route
  const rwPaths = getPaths()

  const isProd = !viteDevServer

  let entryServerImport: any

  if (viteDevServer) {
    entryServerImport = await viteDevServer.ssrLoadModule(
      rwPaths.web.entryServer as string // already validated in dev server
    )
  } else {
    entryServerImport = await import(rwPaths.web.distEntryServer)
  }

  const ServerEntry = entryServerImport.ServerEntry || entryServerImport.default

  return async (req: Request, res: Response) => {
    if (redirect) {
      res.redirect(redirect.to)
    }

    const currentPathName = req.path

    let metaTags: TagDescriptor[] = []

    let routeHookPath = routeHooks

    if (isProd) {
      routeHookPath = routeHooks
        ? path.join(rwPaths.web.distRouteHooks, routeHooks)
        : null
    }

    // @TODO can we load the route hook outside the handler?
    const routeHookOutput = await loadAndRunRouteHooks({
      paths: [getAppRouteHook(isProd), routeHookPath],
      reqMeta: {
        req,
        parsedParams: req.params,
      },
      viteDevServer,
    })

    metaTags = routeHookOutput.meta

    const jsBundles = [
      clientEntryPath, // @NOTE: must have slash in front
      bundle && '/' + bundle,
    ].filter(Boolean) as string[]

    const isSeoCrawler = checkUaForSeoCrawler(req.headers['user-agent'] || '')

    reactRenderToStream(
      {
        ServerEntry,
        currentPathName,
        metaTags,
        cssLinks,
        isProd,
        jsBundles,
        res,
      },
      {
        waitForAllReady: isSeoCrawler,
      }
    )
  }
}
