import { createServerAdapter } from '@whatwg-node/server'
import express from 'express'
import type { ViteDevServer } from 'vite'
import { createServer as createViteServer } from 'vite'

import type { RouteSpec } from '@redwoodjs/internal/dist/routes'
import { getProjectRoutes } from '@redwoodjs/internal/dist/routes'
import type { Paths } from '@redwoodjs/project-config'
import { getConfig, getPaths } from '@redwoodjs/project-config'

import { collectCssPaths, componentsModules } from './streaming/collectCss'
import { createReactStreamingHandler } from './streaming/createReactStreamingHandler'
import { registerFwGlobals } from './streaming/registerGlobals'
import { ensureProcessDirWeb } from './utils'

// TODO (STREAMING) Just so it doesn't error out. Not sure how to handle this.
globalThis.__REDWOOD__PRERENDER_PAGES = {}

async function createServer() {
  ensureProcessDirWeb()

  registerFwGlobals()

  const app = express()
  const rwPaths = getPaths()

  // ~~~ Dev time validations ~~~~
  // TODO (STREAMING) When Streaming is released Vite will be the only bundler,
  // and this file should always exist. So the error message needs to change
  // (or be removed perhaps)
  if (!rwPaths.web.entryServer || !rwPaths.web.entryClient) {
    throw new Error(
      'Vite entry points not found. Please check that your project has ' +
        'an entry.client.{jsx,tsx} and entry.server.{jsx,tsx} file in ' +
        'the web/src directory.'
    )
  }

  if (!rwPaths.web.viteConfig) {
    throw new Error(
      'Vite config not found. You need to setup your project with Vite using `yarn rw setup vite`'
    )
  }
  // ~~~~ Dev time validations ~~~~

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

  const routes = getProjectRoutes()

  for (const route of routes) {
    const routeHandler = await createReactStreamingHandler(
      {
        route,
        clientEntryPath: rwPaths.web.entryClient as string,
        getStylesheetLinks: () => getCssLinks(rwPaths, route, vite),
      },
      vite
    )

    // @TODO if it is a 404, hand over to 404 handler
    if (!route.matchRegexString) {
      continue
    }

    // @TODO we no longer need to use the regex
    const expressPathDef = route.hasParams
      ? route.matchRegexString
      : route.pathDefinition

    app.get(expressPathDef, createServerAdapter(routeHandler))
  }

  const port = getConfig().web.port
  console.log(`Started server on http://localhost:${port}`)
  return await app.listen(port)
}

let devApp = createServer()

process.stdin.on('data', async (data) => {
  const str = data.toString().trim().toLowerCase()
  if (str === 'rs' || str === 'restart') {
    console.log('Restarting dev web server.....')
    ;(await devApp).close(() => {
      devApp = createServer()
    })
  }
})

/**
 * This function is used to collect the CSS links for a given route.
 *
 * Passed as a getter to the createReactStreamingHandler function, because
 * at the time of creating the handler, the ViteDevServer hasn't analysed the module graph yet
 */
function getCssLinks(rwPaths: Paths, route: RouteSpec, vite: ViteDevServer) {
  const appAndRouteModules = componentsModules(
    [rwPaths.web.app, route.filePath].filter(Boolean) as string[],
    vite
  )

  const collectedCss = collectCssPaths(appAndRouteModules)

  const cssLinks = Array.from(collectedCss)
  return cssLinks
}
