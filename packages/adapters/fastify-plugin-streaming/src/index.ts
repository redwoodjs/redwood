import Middie from '@fastify/middie'
import { createServerAdapter } from '@whatwg-node/server'
import type { FastifyInstance, HookHandlerDoneFunction } from 'fastify'
import type { FastifyReply, FastifyRequest } from 'fastify'
import type { ViteDevServer } from 'vite'
import { createServer as createViteServer } from 'vite'

import type { RouteSpec } from '@redwoodjs/internal/dist/routes'
import { getProjectRoutes } from '@redwoodjs/internal/dist/routes'
import type { Paths } from '@redwoodjs/project-config'
import { getPaths } from '@redwoodjs/project-config'

import { collectCssPaths, componentsModules } from './streaming/collectCss'
import { createReactStreamingHandler } from './streaming/createReactStreamingHandler'
import { registerFwGlobals } from './streaming/registerGlobals'

type RedwoodStreamingOptions = {}

export async function RedwoodStreaming(
  fastify: FastifyInstance,
  _opts: RedwoodStreamingOptions,
  done: HookHandlerDoneFunction
) {
  registerFwGlobals()

  const rwPaths = getPaths()

  // Create Vite server in middleware mode and configure the app type as
  // 'custom', disabling Vite's own HTML serving logic so parent server
  // can take control
  const vite = await createViteServer({
    configFile: rwPaths.web.viteConfig as string,
    server: { middlewareMode: true },
    logLevel: 'info',
    clearScreen: false,
    appType: 'custom',
  })

  await fastify.register(Middie)

  // use vite's connect instance as middleware
  fastify.use(vite.middlewares)

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

    fastify.get(expressPathDef, createFetchRequestHandler(routeHandler))
  }

  done()
}

function createFetchRequestHandler(
  routeHandler: (req: Request) => Promise<Response>
) {
  return async function fetchRequestHandler(
    req: FastifyRequest,
    reply: FastifyReply
  ): Promise<FastifyReply> {
    const myServerAdapter = createServerAdapter(routeHandler)

    const response = await myServerAdapter.handleNodeRequest(req, {
      req,
      reply,
    })

    response.headers.forEach((value, key) => {
      reply.header(key, value)
    })

    reply.status(response.status)

    // Fastify doesn't accept `null` as a response body
    reply.send(response.body || undefined)

    return reply
  }
}

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
