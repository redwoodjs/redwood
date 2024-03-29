// TODO (STREAMING) Move this to a new package called @redwoodjs/fe-server (goes
// well in naming with @redwoodjs/api-server)
// Only things used during dev can be in @redwoodjs/vite. Everything else has
// to go in fe-server
// UPDATE: We decided to name the package @redwoodjs/web-server instead of
// fe-server. And it's already created, but this hasn't been moved over yet.

import path from 'node:path'
import url from 'node:url'

import { createServerAdapter } from '@whatwg-node/server'
// @ts-expect-error We will remove dotenv-defaults from this package anyway
import { config as loadDotEnv } from 'dotenv-defaults'
import express from 'express'
import { createProxyMiddleware } from 'http-proxy-middleware'
import type { Manifest as ViteBuildManifest } from 'vite'

import type { RWRouteManifestItem } from '@redwoodjs/internal/dist/routes'
import { getConfig, getPaths } from '@redwoodjs/project-config'

import { registerFwGlobalsAndShims } from './lib/registerFwGlobalsAndShims.js'
import { createExtensionRouteDef } from './middleware/extensionRouteDef.js'
import { invoke } from './middleware/invokeMiddleware.js'
import { createRscRequestHandler } from './rsc/rscRequestHandler.js'
import { setClientEntries } from './rsc/rscWorkerCommunication.js'
import { createReactStreamingHandler } from './streaming/createReactStreamingHandler.js'
import type { RWRouteManifest } from './types.js'

/**
 * TODO (STREAMING)
 * We have this server in the vite package only temporarily.
 * We will need to decide where to put it, so that rwjs/internal and other heavy dependencies
 * can be removed from the final docker image
 */

// --- @MARK This should be removed once we have re-architected the rw serve command ---
// We need the dotenv, so that prisma knows the DATABASE env var
// Normally the RW cli loads this for us, but we expect this file to be run directly
// without using the CLI. Remember to remove dotenv-defaults dependency from this package
loadDotEnv({
  path: path.join(getPaths().base, '.env'),
  defaults: path.join(getPaths().base, '.env.defaults'),
  multiline: true,
})
// ------------------------------------------------

export async function runFeServer() {
  const app = express()
  const rwPaths = getPaths()
  const rwConfig = getConfig()
  const rscEnabled = rwConfig.experimental?.rsc?.enabled

  registerFwGlobalsAndShims()

  if (rscEnabled) {
    try {
      // This will fail if we're not running in RSC mode (i.e. for Streaming SSR)
      await setClientEntries()
    } catch (e) {
      console.error('Failed to load client entries')
      console.error(e)
      process.exit(1)
    }
  }

  const routeManifestUrl = url.pathToFileURL(rwPaths.web.routeManifest).href
  const routeManifest: RWRouteManifest = (
    await import(routeManifestUrl, { with: { type: 'json' } })
  ).default

  const clientBuildManifestUrl = url.pathToFileURL(
    path.join(rwPaths.web.distClient, 'client-build-manifest.json'),
  ).href
  const clientBuildManifest: ViteBuildManifest = (
    await import(clientBuildManifestUrl, { with: { type: 'json' } })
  ).default

  if (rwConfig.experimental?.rsc?.enabled) {
    console.log('='.repeat(80))
    console.log('buildManifest', clientBuildManifest)
    console.log('='.repeat(80))
  }

  // @MARK: Surely there's a better way than this!
  const clientEntry = Object.values(clientBuildManifest).find(
    (manifestItem) => {
      // For RSC builds, we pass in many Vite entries, so we need to find it differently.
      return rscEnabled
        ? manifestItem.file.includes('rwjs-client-entry-')
        : manifestItem.isEntry
    },
  )

  const handleWithMiddleware = (route?: RWRouteManifestItem) => {
    return createServerAdapter(async (req: Request) => {
      const entryServerImport = await import(rwPaths.web.entryServer as string)

      const middleware = entryServerImport.middleware

      const [mwRes] = await invoke(req, middleware, route ? { route } : {})

      return mwRes.toResponse()
    })
  }

  if (!clientEntry) {
    throw new Error('Could not find client entry in build manifest')
  }

  // 1. Use static handler for assets
  // For CF workers, we'd need an equivalent of this
  app.use(
    '/assets',
    express.static(rwPaths.web.distClient + '/assets', { index: false }),
  )

  // 2. Proxy the api server
  // TODO (STREAMING) we need to be able to specify whether proxying is required or not
  // e.g. deploying to Netlify, we don't need to proxy but configure it in Netlify
  // Also be careful of differences between v2 and v3 of the server
  app.use(
    rwConfig.web.apiUrl,
    // @WARN! Be careful, between v2 and v3 of http-proxy-middleware
    // the syntax has changed https://github.com/chimurai/http-proxy-middleware
    createProxyMiddleware({
      changeOrigin: false,
      pathRewrite: {
        [`^${rwConfig.web.apiUrl}`]: '', // remove base path
      },
      // Using 127.0.0.1 to force ipv4. With `localhost` you don't really know
      // if it's going to be ipv4 or ipv6
      target: `http://127.0.0.1:${rwConfig.api.port}`,
    }),
  )

  const getStylesheetLinks = () => clientEntry.css || []
  const clientEntryPath = '/' + clientEntry.file

  for (const route of Object.values(routeManifest)) {
    // if it is a 404, register it at the end somehow.
    if (!route.matchRegexString) {
      continue
    }

    // @TODO: we don't need regexes here
    // Param matching, etc. all handled within the route handler now
    const expressPathDef = route.hasParams
      ? route.matchRegexString
      : route.pathDefinition

    // TODO(RSC_DC): RSC is rendering blank page, try using this function for initial render
    const routeHandler = await createReactStreamingHandler({
      route,
      clientEntryPath,
      getStylesheetLinks,
    })

    console.log('Attaching streaming handler for route', route.pathDefinition)

    // Wrap with whatg/server adapter. Express handler -> Fetch API handler
    app.get(expressPathDef, createServerAdapter(routeHandler))

    // add express routes to capture extension requests and give them to middleware
    // ie. /about.json, /about.png, etc
    // Note this happens _after_ the actual route handlers. So if you have a route /file/:fileNameWithExtension
    // it will still be handled by the route handler, not the middleware
    app.get(
      createExtensionRouteDef(route.matchRegexString),
      handleWithMiddleware(route),
    )
  }

  // Mounting middleware at /rw-rsc will strip /rw-rsc from req.url
  app.use('/rw-rsc', createRscRequestHandler())

  // @MARK: put this after rw-rsc!
  app.post('*', handleWithMiddleware())

  app.use(express.static(rwPaths.web.distClient, { index: false }))

  app.listen(rwConfig.web.port)
  console.log(
    `Started production FE server on http://localhost:${rwConfig.web.port}`,
  )
}

runFeServer()
