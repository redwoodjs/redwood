import path from 'path'

import isbot from 'isbot'
import type { ViteDevServer } from 'vite'

import type { RWRouteManifestItem } from '@redwoodjs/internal'
import { getAppRouteHook, getConfig, getPaths } from '@redwoodjs/project-config'
import { matchPath } from '@redwoodjs/router'
import type { TagDescriptor } from '@redwoodjs/web'

import { reactRenderToStreamResponse } from './streamHelpers'
import { loadAndRunRouteHooks } from './triggerRouteHooks'

interface CreateReactStreamingHandlerOptions {
  route: RWRouteManifestItem
  clientEntryPath: string
  getStylesheetLinks: () => string[]
}

const checkUaForSeoCrawler = isbot.spawn()
checkUaForSeoCrawler.exclude(['chrome-lighthouse'])

export const createReactStreamingHandler = async (
  {
    route,
    clientEntryPath,
    getStylesheetLinks,
  }: CreateReactStreamingHandlerOptions,
  viteDevServer?: ViteDevServer
) => {
  const { redirect, routeHooks, bundle } = route
  const rwPaths = getPaths()

  const isProd = !viteDevServer

  let entryServerImport: any
  let fallbackDocumentImport: any

  if (isProd) {
    // TODO (RSC) Consolidate paths, so we can have the same code for SSR and RSC
    if (getConfig().experimental?.rsc?.enabled) {
      entryServerImport = await import(
        makeFilePath(
          path.join(rwPaths.web.distServer, 'assets', 'entry.server.js')
        )
      )
      fallbackDocumentImport = await import(
        makeFilePath(path.join(rwPaths.web.distServer, 'assets', 'Document.js'))
      )
    } else {
      entryServerImport = await import(
        makeFilePath(rwPaths.web.distEntryServer)
      )
      fallbackDocumentImport = await import(
        makeFilePath(rwPaths.web.distDocumentServer)
      )
    }
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
      fallbackDocumentImport = await viteDevServer.ssrLoadModule(
        rwPaths.web.document
      )
    }

    const ServerEntry =
      entryServerImport.ServerEntry || entryServerImport.default

    const FallbackDocument =
      fallbackDocumentImport.Document || fallbackDocumentImport.default

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

    // Using a function to get the CSS links because we need to wait for the
    // vite dev server to analyze the module graph
    const cssLinks = getStylesheetLinks()

    const reactResponse = await reactRenderToStreamResponse(
      {
        ServerEntry,
        FallbackDocument,
        currentPathName,
        metaTags,
        cssLinks,
        isProd,
        jsBundles,
      },
      {
        waitForAllReady: isSeoCrawler,
        onError: (err) => {
          if (!isProd && viteDevServer) {
            viteDevServer.ssrFixStacktrace(err)
          }

          console.error(err)
        },
      }
    )

    return reactResponse
  }
}

function makeFilePath(path: string): string {
  // Without this, absolute paths can't be imported on Windows
  return 'file:///' + path
}
