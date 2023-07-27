// TODO (STREAMING) Merge with runFeServer so we only have one file

import path from 'path'

import React from 'react'

import express from 'express'
import { renderToPipeableStream } from 'react-dom/server'
import { createServer as createViteServer } from 'vite'

import { getProjectRoutes } from '@redwoodjs/internal/dist/routes'
import { getAppRouteHook, getConfig, getPaths } from '@redwoodjs/project-config'
import { matchPath } from '@redwoodjs/router'
import type { TagDescriptor } from '@redwoodjs/web'
// @NOTE (STREAMING): We can't directly import from web at the moment
// The dist imports will go away once we can do ESM with exports field
import { ServerHtmlProvider } from '@redwoodjs/web/dist/components/ServerInject'

import { loadAndRunRouteHooks } from './triggerRouteHooks'
import { ensureProcessDirWeb, stripQueryStringAndHashFromPath } from './utils'

// These values are defined in the vite.config.ts
globalThis.RWJS_ENV = {}

// TODO (STREAMING) Just so it doesn't error out. Not sure how to handle this.
globalThis.__REDWOOD__PRERENDER_PAGES = {}

async function createServer() {
  ensureProcessDirWeb()

  const app = express()
  const rwPaths = getPaths()

  // TODO (STREAMING) When Streaming is released Vite will be the only bundler,
  // and this file should always exist. So the error message needs to change
  // (or be removed perhaps)
  if (!rwPaths.web.viteConfig) {
    throw new Error(
      'Vite config not found. You need to setup your project with Vite using `yarn rw setup vite`'
    )
  }

  // Create Vite server in middleware mode and configure the app type as
  // 'custom', disabling Vite's own HTML serving logic so parent server
  // can take control
  const vite = await createViteServer({
    configFile: rwPaths.web.viteConfig,
    server: { middlewareMode: true },
    logLevel: 'info',
    clearScreen: false,
    appType: 'custom',
  })

  // use vite's connect instance as middleware
  app.use(vite.middlewares)

  app.use('*', async (req, res, next) => {
    const currentPathName = stripQueryStringAndHashFromPath(req.originalUrl)
    globalThis.__REDWOOD__HELMET_CONTEXT = {}

    try {
      const routes = getProjectRoutes()

      // Do a simple match with regex, don't bother parsing params yet
      const currentRoute = routes.find((route) => {
        if (!route.matchRegexString) {
          // This is the 404/NotFoundPage case
          return false
        }

        const matches = [
          ...currentPathName.matchAll(new RegExp(route.matchRegexString, 'g')),
        ]

        return matches.length > 0
      })

      let metaTags: TagDescriptor[] = []

      if (currentRoute?.redirect) {
        return res.redirect(currentRoute.redirect.to)
      }

      if (currentRoute) {
        const parsedParams = currentRoute.hasParams
          ? matchPath(currentRoute.path, currentPathName).params
          : undefined

        const routeHookOutput = await loadAndRunRouteHooks({
          paths: [getAppRouteHook(), currentRoute.routeHooks],
          reqMeta: {
            req,
            parsedParams,
          },
          viteDevServer: vite, // because its dev
        })

        metaTags = routeHookOutput.meta
      }

      if (!currentRoute) {
        // TODO (STREAMING) do something
      }

      if (!rwPaths.web.entryServer || !rwPaths.web.entryClient) {
        throw new Error(
          'Vite entry points not found. Please check that your project has ' +
            'an entry.client.{jsx,tsx} and entry.server.{jsx,tsx} file in ' +
            'the web/src directory.'
        )
      }

      // 3. Load the server entry. vite.ssrLoadModule automatically transforms
      //    your ESM source code to be usable in Node.js! There is no bundling
      //    required, and provides efficient invalidation similar to HMR.
      const { ServerEntry } = await vite.ssrLoadModule(rwPaths.web.entryServer)

      // TODO (STREAMING) CSS is handled by Vite in dev mode, we don't need to
      // worry about it in dev but..... it causes a flash of unstyled content.
      // For now I'm just injecting index css here
      // Looks at collectStyles in packages/vite/src/fully-react/find-styles.ts
      const FIXME_HardcodedIndexCss = ['index.css']

      const assetMap = JSON.stringify({
        css: FIXME_HardcodedIndexCss,
        meta: metaTags,
      })

      const bootstrapModules = [
        path.join(__dirname, '../inject', 'reactRefresh.js'),
      ]

      const pageWithJs = currentRoute?.renderMode !== 'html'

      if (pageWithJs) {
        bootstrapModules.push(rwPaths.web.entryClient)
      }

      const { pipe } = renderToPipeableStream(
        React.createElement(
          ServerHtmlProvider,
          {},
          ServerEntry({
            url: currentPathName,
            css: FIXME_HardcodedIndexCss,
            meta: metaTags,
          })
        ),
        {
          bootstrapScriptContent: pageWithJs
            ? `window.__assetMap = function() { return ${assetMap} }`
            : undefined,
          bootstrapModules,
          onShellReady() {
            res.setHeader('content-type', 'text/html; charset=utf-8')
            pipe(res)
          },
        }
      )
    } catch (e) {
      // TODO (STREAMING) Is this what we want to do?
      // send back a SPA page
      // res.status(200).set({ 'Content-Type': 'text/html' }).end(template)

      // If an error is caught, let Vite fix the stack trace so it maps back to
      // your actual source code.
      vite.ssrFixStacktrace(e as any)
      next(e)
    }
  })

  const port = getConfig().web.port
  console.log(`Started server on http://localhost:${port}`)
  return await app.listen(port)
}

let devApp = createServer()

process.stdin.on('data', async (data) => {
  const str = data.toString().trim().toLowerCase()
  if (str === 'rs' || str === 'restart') {
    ;(await devApp).close()
    devApp = createServer()
  }
})
