import path from 'path'

import express from 'express'
import { renderToPipeableStream } from 'react-dom/server'
import { createServer as createViteServer } from 'vite'

import { getProjectRoutes } from '@redwoodjs/internal/dist/routes'
import { getAppRouteHook, getConfig, getPaths } from '@redwoodjs/project-config'
import { matchPath } from '@redwoodjs/router'
import type { TagDescriptor } from '@redwoodjs/web'

import { triggerRouteHooks } from './triggerRouteHooks'
import { stripQueryStringAndHashFromPath } from './utils'

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
    const currentPathName = stripQueryStringAndHashFromPath(req.originalUrl)

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

      let serverData = {}
      let metaTags: TagDescriptor[] = []

      if (currentRoute?.redirect) {
        return res.redirect(currentRoute.redirect.to)
      }

      if (currentRoute) {
        // A. Trigger app route hook
        const rootRouteHookOutput = await runDevRouteHooks(getAppRouteHook())

        // B. Trigger current route RH
        const currentRouteHookOutput = await runDevRouteHooks(
          currentRoute.routeHooks,
          currentRoute.hasParams
            ? matchPath(currentRoute.path, currentPathName).params
            : undefined,
          rootRouteHookOutput
        )

        // Compose the appRH output and RH output
        serverData = {
          ...rootRouteHookOutput.serverData,
          ...currentRouteHookOutput.serverData,
        }

        metaTags = [...rootRouteHookOutput.meta, ...currentRouteHookOutput.meta]
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
      const serialisedRouteContext = JSON.stringify(serverData)

      // @TODO CSS is handled by Vite in dev mode, we don't need to worry about it in dev
      // but..... it causes a flash of unstyled content. For now I'm just injecting index css here
      const FIXME_HardcodedIndexCss = ['index.css']

      const bootstrapModules = [
        path.join(__dirname, '../inject', 'reactRefresh.js'),
      ]

      const pageWithJs = currentRoute?.renderMode !== 'html'

      if (pageWithJs) {
        bootstrapModules.push(rwPaths.web.entryClient)
      }

      const { pipe } = renderToPipeableStream(
        serverEntry({
          url: currentPathName,
          routeContext: serverData,
          css: FIXME_HardcodedIndexCss,
          meta: metaTags,
        }),
        {
          bootstrapScriptContent: pageWithJs
            ? `window.__loadServerData = function() { return ${serialisedRouteContext} }; window.__assetMap = function() { return ${JSON.stringify(
                {
                  css: FIXME_HardcodedIndexCss,
                  meta: metaTags,
                }
              )} }`
            : undefined,
          bootstrapModules,
          onShellReady() {
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

    // @TODO Refactor this
    // WE are repeating code a lot between runFeServer and devFeServer
    async function runDevRouteHooks(
      routeHookPath: string | null | undefined,
      parsedParams?: Record<string, any>,
      appRouteHookOutput?: { meta: TagDescriptor[]; serverData: any }
    ) {
      if (routeHookPath) {
        try {
          const routeHooks = await vite.ssrLoadModule(routeHookPath)

          const output = await triggerRouteHooks({
            routeHooks,
            req,
            parsedParams,
            appRouteHookOutput,
          })

          return {
            serverData: output.serverData,
            meta: output.meta,
          }
        } catch (e) {
          console.error(`Error running route hooks in ${routeHookPath}}`)
          console.error(e)
        }
      }

      // Empty values if error, or no routeHookPath
      return { serverData: {}, meta: [] }
    }
  })

  const port = getConfig().web.port
  app.listen(port)
  console.log(`Started server on http://localhost:${port}`)
}

createServer()
