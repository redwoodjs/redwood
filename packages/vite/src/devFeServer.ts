import path from 'path'

import express from 'express'
import { renderToPipeableStream } from 'react-dom/server'
import { createServer as createViteServer } from 'vite'

import { getProjectRoutes } from '@redwoodjs/internal/dist/routes'
import { getPaths, getConfig } from '@redwoodjs/project-config'

// These values are defined in the vite.config.ts
globalThis.RWJS_ENV = {}

async function createServer() {
  const app = express()
  const rwPaths = getPaths()

  // @MARK: Vite is still experimental, and opt-in
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
  // if you use your own express router (express.Router()), you should use router.use
  app.use(vite.middlewares)

  app.use('*', async (req, res, next) => {
    const url = req.originalUrl
    try {
      // @MARK: using virtual modules here, so we can actually find the chunk we need! 🤯
      // I'm not convinved we need virtual modules anymore..... or we'd need to rollup the logic in serveBuilt
      // into a function in internal, and generate the virtual module using it
      // const { default: routes } = (await vite.ssrLoadModule(
      //   'virtual:rw-routes'
      // )) as { default: VirtualRoute[] }

      const routes = getProjectRoutes()

      const currentRoute = routes.find((route) => {
        if (!route.matchRegexString) {
          // This is the 404/NotFoundPage case
          return false
        }

        const matches = [
          ...url.matchAll(new RegExp(route.matchRegexString, 'g')),
        ]
        return matches.length > 0
      })

      let routeContext = {}

      if (currentRoute?.redirect) {
        // @TODO deal with permanent/temp
        // Shortcircuit, and return a 301 or 302
        return res.redirect(currentRoute.redirect.to)
      }

      if (currentRoute && currentRoute.routeHooks) {
        try {
          const routeHooks = await vite.ssrLoadModule(currentRoute.routeHooks)

          // @TODO decide what the shape of parameters passed to serverData should be
          const serverData = await routeHooks.serverData(req)

          routeContext = {
            ...serverData,
          }
        } catch (e) {
          console.error(e)
        }
      }

      if (!currentRoute) {
        // @TODO do something
      }

      if (!rwPaths.web.entryServer || !rwPaths.web.entryClient) {
        throw new Error(
          'Vite entry points not found. Please check that your project has an entry-client.{jsx,tsx} and entry-server.{jsx,tsx} file in the web/src directory.'
        )
      }

      // 3. Load the server entry. vite.ssrLoadModule automatically transforms
      //    your ESM source code to be usable in Node.js! There is no bundling
      //    required, and provides efficient invalidation similar to HMR.
      const { serverEntry } = await vite.ssrLoadModule(rwPaths.web.entryServer)

      // Serialize route context so it can be passed to the client entry
      const serialisedRouteContext = JSON.stringify(routeContext)

      const { pipe } = renderToPipeableStream(
        // CSS is handled by Vite in dev mode, we don't need to worry about it in dev
        serverEntry({ url, routeContext, css: [] }),
        {
          bootstrapScriptContent: `window.__loadServerData = function() { return ${serialisedRouteContext} }`,
          bootstrapModules: [
            path.join(__dirname, '../inject', 'reactRefresh.js'),
            rwPaths.web.entryClient,
          ],
          onAllReady() {
            res.setHeader('content-type', 'text/html; charset=utf-8')
            pipe(res)
          },
        }
      )
    } catch (e) {
      // send back a SPA page
      // res.status(200).set({ 'Content-Type': 'text/html' }).end(template)

      // If an error is caught, let Vite fix the stack trace so it maps back to
      // your actual source code.
      vite.ssrFixStacktrace(e as any)
      next(e)
    }
  })

  const port = getConfig().web.port
  app.listen(port)
  console.log(`Started server on http://localhost:${port}`)
}

createServer()
