import path from 'path'

// @ts-expect-error We will remove dotenv-defaults from this package anyway
import { config as loadDotEnv } from 'dotenv-defaults'
import express from 'express'
import { createProxyMiddleware } from 'http-proxy-middleware'
import { renderToPipeableStream } from 'react-dom/server'
import type { Manifest as ViteBuildManifest } from 'vite'

import { getPaths, getConfig } from '@redwoodjs/project-config'
import { matchPath } from '@redwoodjs/router'
import type { TagDescriptor } from '@redwoodjs/web'

import { triggerRouteHooks } from './triggerRouteHooks'
import { RWRouteManifest } from './types'
import { stripQueryStringAndHashFromPath } from './utils'

globalThis.RWJS_ENV = {}

/**
 * @MARK @TODO
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
//------------------------------------------------

export async function runFeServer() {
  const app = express()
  const rwPaths = getPaths()
  const rwConfig = getConfig()

  const routeManifest: RWRouteManifest = await import(
    rwPaths.web.dist + '/server/route-manifest.json',
    { assert: { type: 'json' } }
  )

  const buildManifest: ViteBuildManifest = await import(
    rwPaths.web.dist + '/build-manifest.json',
    { assert: { type: 'json' } }
  )

  const indexEntry = Object.values(buildManifest).find((manifestItem) => {
    return manifestItem.isEntry
  })

  if (!indexEntry) {
    throw new Error('Could not find index.html in build manifest')
  }

  // 👉 1. Use static handler for assets
  // For CF workers, we'd need an equivalent of this
  app.use('/assets', express.static(rwPaths.web.dist + '/assets'))

  // 👉 2. Proxy the api server
  // @TODO we need to be able to specify whether proxying is required or not
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

  // 👉 3. Handle all other requests with the server entry
  // This is where we match the url to the correct route, and render it
  // We also call the relevant routeHooks here
  app.use('*', async (req, res) => {
    const currentPathName = stripQueryStringAndHashFromPath(req.originalUrl)

    try {
      const { serverEntry } = await import(
        path.join(rwPaths.web.distServer, '/entry-server.js')
      )

      // @MARK should we generate individual express Routes for each Route?
      // This would make handling 404s and favicons / public assets etc. easier
      const currentRoute = Object.values(routeManifest).find((route) => {
        if (!route.matchRegexString) {
          // This is the 404/NotFoundPage case
          return false
        }

        const matches = [
          ...currentPathName.matchAll(new RegExp(route.matchRegexString, 'g')),
        ]
        return matches.length > 0
      })

      // Doesn't match any of the defined Routes
      // Render 404 page, and send back 404 status
      if (!currentRoute) {
        // @MARK should we CONST it?
        const fourOhFourRoute = routeManifest['notfound']

        if (!fourOhFourRoute) {
          return res.sendStatus(404)
        }

        const { pipe } = renderToPipeableStream(
          // @TODO: we can pass in meta here as well
          // we should use the same shape as Remix or Next for the meta object
          serverEntry({
            url: currentPathName,
            routeContext: null,
            css: indexEntry.css,
          }),
          {
            bootstrapScriptContent: `window.__assetMap = function() { return ${JSON.stringify(
              { css: indexEntry.css }
            )} }`,
            // @NOTE have to add slash so subpaths still pick up the right file
            // Vite is currently producing modules not scripts: https://vitejs.dev/config/build-options.html#build-target
            bootstrapModules: [
              '/' + indexEntry.file,
              '/' + fourOhFourRoute.bundle,
            ],
            onShellReady() {
              res.setHeader('content-type', 'text/html')
              res.status(404)
              pipe(res)
            },
          }
        )

        return
      }

      let routeContext = {}
      let metaTags: TagDescriptor[] = []

      if (currentRoute?.redirect) {
        // @TODO deal with permanent/temp
        // Short-circuit, and return a 301 or 302
        return res.redirect(currentRoute.redirect.to)
      }

      if (currentRoute && currentRoute.routeHooks) {
        try {
          const routeHooks = await import(
            path.join(rwPaths.web.distRouteHooks, currentRoute.routeHooks)
          )

          const { serverData, meta } = await triggerRouteHooks({
            routeHooks,
            req,
            parsedParams: currentRoute.hasParams
              ? matchPath(currentRoute.pathDefinition, currentPathName).params
              : undefined,
          })

          routeContext = {
            ...serverData,
          }

          metaTags = meta
        } catch (e) {
          console.error(e)
          return
        }
      }

      // Serialize route context so it can be passed to the client entry
      const serializedRouteContext = JSON.stringify(routeContext)

      const { pipe } = renderToPipeableStream(
        // @TODO: we can pass in meta here as well
        // we should use the same shape as Remix or Next for the meta object
        serverEntry({
          url: currentPathName,
          routeContext,
          css: indexEntry.css,
        }),
        {
          bootstrapScriptContent: `window.__loadServerData = function() { return ${serializedRouteContext} }; window.__assetMap = function() { return ${JSON.stringify(
            { css: indexEntry.css, meta: metaTags }
          )} }`,
          // @NOTE have to add slash so subpaths still pick up the right file
          // Vite is currently producing modules not scripts: https://vitejs.dev/config/build-options.html#build-target
          bootstrapModules: ['/' + indexEntry.file, '/' + currentRoute.bundle],
          onShellReady() {
            res.setHeader('content-type', 'text/html; charset=utf-8')
            pipe(res)
          },
          // onAllReady() {
          //   res.setHeader('content-type', 'text/html')
          //   pipe(res)
          // }
        }
      )
    } catch (e) {
      console.error(e)

      // streaming no longer requires us to send back a blank page
      // React will automatically switch to client rendering on error
      return res.sendStatus(500)
    }

    return
  })

  app.listen(rwConfig.web.port)
  console.log(
    `Started production FE server on http://localhost:${rwConfig.web.port}`
  )
}

runFeServer()
