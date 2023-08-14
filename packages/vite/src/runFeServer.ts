// TODO (STREAMING) Move this to a new package called @redwoodjs/fe-server (goes
// well in naming with @redwoodjs/api-server)
// Only things used during dev can be in @redwoodjs/vite. Everything else has
// to go in fe-server

import fs from 'fs/promises'
import path from 'path'

// @ts-expect-error We will remove dotenv-defaults from this package anyway
import { config as loadDotEnv } from 'dotenv-defaults'
import express from 'express'
import { createProxyMiddleware } from 'http-proxy-middleware'
import isbot from 'isbot'
import { renderToPipeableStream } from 'react-dom/server'
import type { Manifest as ViteBuildManifest } from 'vite'

import { getConfig, getPaths } from '@redwoodjs/project-config'
import { matchPath } from '@redwoodjs/router'
import type { TagDescriptor } from '@redwoodjs/web'

import { registerFwGlobals } from './streaming/registerGlobals'
import { loadAndRunRouteHooks } from './streaming/triggerRouteHooks'
import { RWRouteManifest } from './types'
import { stripQueryStringAndHashFromPath } from './utils'

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
//------------------------------------------------

const checkUaForSeoCrawler = isbot.spawn()
checkUaForSeoCrawler.exclude(['chrome-lighthouse'])

export async function runFeServer() {
  const app = express()
  const rwPaths = getPaths()
  const rwConfig = getConfig()

  registerFwGlobals()

  // TODO When https://github.com/tc39/proposal-import-attributes and
  // https://github.com/microsoft/TypeScript/issues/53656 have both landed we
  // should try to do this instead:
  // const routeManifest: RWRouteManifest = await import(
  //   rwPaths.web.routeManifest, { with: { type: 'json' } }
  // )
  // NOTES:
  //  * There's a related babel plugin here
  //    https://babeljs.io/docs/babel-plugin-syntax-import-attributes
  //     * Included in `preset-env` if you set `shippedProposals: true`
  //  * We had this before, but with `assert` instead of `with`. We really
  //    should be using `with`. See motivation in issues linked above.
  //  * With `assert` and `@babel/plugin-syntax-import-assertions` the
  //    code compiled and ran properly, but Jest tests failed, complaining
  //    about the syntax.
  const routeManifestStr = await fs.readFile(rwPaths.web.routeManifest, 'utf-8')
  const routeManifest: RWRouteManifest = JSON.parse(routeManifestStr)

  // TODO See above about using `import { with: { type: 'json' } }` instead
  const manifestPath = path.join(getPaths().web.dist, 'build-manifest.json')
  const buildManifestStr = await fs.readFile(manifestPath, 'utf-8')
  const buildManifest: ViteBuildManifest = JSON.parse(buildManifestStr)

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

  // 👉 3. Handle all other requests with the server entry
  // This is where we match the url to the correct route, and render it
  // We also call the relevant routeHooks here
  app.use('*', async (req, res) => {
    const currentPathName = stripQueryStringAndHashFromPath(req.originalUrl)

    try {
      const { ServerEntry } = await import(rwPaths.web.distEntryServer)

      // TODO (STREAMING) should we generate individual express Routes for each Route?
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
        // TODO (STREAMING) should we CONST it?
        const fourOhFourRoute = routeManifest['notfound']

        if (!fourOhFourRoute) {
          return res.sendStatus(404)
        }

        const assetMap = JSON.stringify({ css: indexEntry.css })

        const { pipe } = renderToPipeableStream(
          ServerEntry({
            url: currentPathName,
            routeContext: null,
            css: indexEntry.css,
          }),
          {
            bootstrapScriptContent: `window.__assetMap = function() { return ${assetMap} }`,
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

      let metaTags: TagDescriptor[] = []

      if (currentRoute?.redirect) {
        // TODO (STREAMING) deal with permanent/temp
        // Short-circuit, and return a 301 or 302
        return res.redirect(currentRoute.redirect.to)
      }

      if (currentRoute) {
        // TODO (STREAMING) hardcoded JS file, watchout if we switch to ESM!
        const appRouteHooksPath = path.join(
          rwPaths.web.distRouteHooks,
          'App.routeHooks.js'
        )

        let appRouteHooksExists = false
        try {
          appRouteHooksExists = (await fs.stat(appRouteHooksPath)).isFile()
        } catch {
          // noop
        }

        // Make sure we access the dist routeHooks!
        const routeHookPaths = [
          appRouteHooksExists ? appRouteHooksPath : null,
          currentRoute.routeHooks
            ? path.join(rwPaths.web.distRouteHooks, currentRoute.routeHooks)
            : null,
        ]

        const parsedParams = currentRoute.hasParams
          ? matchPath(currentRoute.pathDefinition, currentPathName).params
          : undefined

        const routeHookOutput = await loadAndRunRouteHooks({
          paths: routeHookPaths,
          reqMeta: {
            req,
            parsedParams,
          },
        })

        metaTags = routeHookOutput.meta
      }

      const pageWithJs = currentRoute.renderMode !== 'html'
      // @NOTE have to add slash so subpaths still pick up the right file
      const bootstrapModules = pageWithJs
        ? ([
            '/' + indexEntry.file,
            currentRoute.bundle && '/' + currentRoute.bundle,
          ].filter(Boolean) as string[])
        : undefined

      const isSeoCrawler = checkUaForSeoCrawler(req.get('user-agent'))

      const { pipe, abort } = renderToPipeableStream(
        ServerEntry({
          url: currentPathName,
          css: indexEntry.css,
          meta: metaTags,
        }),
        {
          bootstrapScriptContent: pageWithJs
            ? `window.__assetMap = function() { return ${JSON.stringify({
                css: indexEntry.css,
                meta: metaTags,
              })} }`
            : undefined,
          bootstrapModules,
          onShellReady() {
            if (!isSeoCrawler) {
              res.setHeader('content-type', 'text/html; charset=utf-8')
              pipe(res)
            }
          },
          onAllReady() {
            if (isSeoCrawler) {
              res.setHeader('content-type', 'text/html; charset=utf-8')
              pipe(res)
            }
          },
          onError(error) {
            console.error(error)
          },
        }
      )

      // TODO (STREAMING) make the timeout configurable
      setTimeout(() => {
        abort()
      }, 10_000)
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
