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

import { getConfig, getPaths } from '@redwoodjs/project-config'

import { createRscRequestHandler } from './rsc/rscRequestHandler'
import { setClientEntries } from './rsc/rscWorkerCommunication'
import { createReactStreamingHandler } from './streaming/createReactStreamingHandler'
import { registerFwGlobals } from './streaming/registerGlobals'
import type { RWRouteManifest } from './types'

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

  registerFwGlobals()

  try {
    // This will fail if we're not running in RSC mode (i.e. for Streaming SSR)
    // TODO (RSC) Remove the try/catch, or at least the if-statement in there
    // once RSC is always enabled
    await setClientEntries('load')
  } catch (e) {
    if (rwConfig.experimental?.rsc?.enabled) {
      console.error('Failed to load client entries')
      console.error(e)
      process.exit(1)
    }
  }

  const routeManifestUrl = url.pathToFileURL(rwPaths.web.routeManifest).href
  const routeManifest: RWRouteManifest = (
    await import(routeManifestUrl, { with: { type: 'json' } })
  ).default

  const buildManifestUrl = url.pathToFileURL(
    path.join(rwPaths.web.dist, 'client-build-manifest.json')
  ).href
  const buildManifest: ViteBuildManifest = (
    await import(buildManifestUrl, { with: { type: 'json' } })
  ).default

  if (rwConfig.experimental?.rsc?.enabled) {
    console.log('='.repeat(80))
    console.log('buildManifest', buildManifest.default)
    console.log('='.repeat(80))
  }

  const indexEntry = Object.values(buildManifest).find((manifestItem) => {
    return manifestItem.isEntry
  })

  if (!indexEntry) {
    throw new Error('Could not find index.html in build manifest')
  }

  // 1. Use static handler for assets
  // For CF workers, we'd need an equivalent of this
  app.use(
    '/assets',
    express.static(rwPaths.web.dist + '/assets', { index: false })
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
      changeOrigin: true,
      pathRewrite: {
        [`^${rwConfig.web.apiUrl}`]: '', // remove base path
      },
      // Using 127.0.0.1 to force ipv4. With `localhost` you don't really know
      // if it's going to be ipv4 or ipv6
      target: `http://127.0.0.1:${rwConfig.api.port}`,
    })
  )

  const getStylesheetLinks = () => indexEntry.css || []
  const clientEntry = '/' + indexEntry.file

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

    if (!getConfig().experimental?.rsc?.enabled) {
      const routeHandler = await createReactStreamingHandler({
        route,
        clientEntryPath: clientEntry,
        getStylesheetLinks,
      })

      // Wrap with whatg/server adapter. Express handler -> Fetch API handler
      app.get(expressPathDef, createServerAdapter(routeHandler))
    } else {
      console.log('expressPathDef', expressPathDef)

      // This is for RSC only. And only for now, until we have SSR working we
      // with RSC. This maps /, /about, etc to index.html
      app.get(expressPathDef, (req, res, next) => {
        // Serve index.html for all routes, to let client side routing take
        // over
        req.url = '/'
        // Without this, we get a flash of a url with a trailing slash. Still
        // works, but doesn't look nice
        // For example, if we navigate to /about we'll see a flash of /about/
        // before returning to /about
        req.originalUrl = '/'

        return express.static(rwPaths.web.dist)(req, res, next)
      })
    }
  }

  // Mounting middleware at /rw-rsc will strip /rw-rsc from req.url
  app.use('/rw-rsc', createRscRequestHandler())

  app.listen(rwConfig.web.port)
  console.log(
    `Started production FE server on http://localhost:${rwConfig.web.port}`
  )
}

runFeServer()
