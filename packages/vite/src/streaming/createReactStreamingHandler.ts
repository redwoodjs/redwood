import path from 'path'

import isbot from 'isbot'
import type { ViteDevServer } from 'vite'

import type { RWRouteManifestItem } from '@redwoodjs/internal'
import { getAppRouteHook, getPaths } from '@redwoodjs/project-config'
import { matchPath } from '@redwoodjs/router'
import type { TagDescriptor } from '@redwoodjs/web'

// import { stripQueryStringAndHashFromPath } from '../utils'

import { reactRenderToStreamResponse } from './streamHelpers'
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

  if (isProd) {
    entryServerImport = await import(rwPaths.web.distEntryServer)
  }

  // @NOTE: we are returning a FetchAPI handler
  return async (req: Request) => {
    if (redirect) {
      return new Response(null, {
        status: 302,
        headers: {
          Location: redirect.to,
        },
      })
    }

    // Do this inside the handler for **dev-only**.
    // This makes sure that changes to entry-server are picked up on refresh
    if (!isProd) {
      entryServerImport = await viteDevServer.ssrLoadModule(
        rwPaths.web.entryServer as string // already validated in dev server
      )
    }

    const ServerEntry =
      entryServerImport.ServerEntry || entryServerImport.default

    const { pathname: currentPathName } = new URL(req.url)

    // @TODO validate this is correct
    const parsedParams = matchPath(route.pathDefinition, currentPathName)

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
        parsedParams,
      },
      viteDevServer,
    })

    metaTags = routeHookOutput.meta

    const jsBundles = [
      clientEntryPath, // @NOTE: must have slash in front
      bundle && '/' + bundle,
    ].filter(Boolean) as string[]

    const isSeoCrawler = checkUaForSeoCrawler(
      req.headers.get('user-agent') || ''
    )

    const reactResponse = await reactRenderToStreamResponse(
      {
        ServerEntry,
        currentPathName,
        metaTags,
        cssLinks,
        isProd,
        jsBundles,
      },
      {
        waitForAllReady: isSeoCrawler,
      }
    )

    return reactResponse
  }
}
