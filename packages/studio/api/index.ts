import path from 'node:path'

import fastifyStatic from '@fastify/static'
import Fastify from 'fastify'
import type { FastifyInstance } from 'fastify'
import open from 'open'

import withApiProxy from './fastify/plugins/withApiProxy'
import spanRoutes from './fastify/spanIngester'
import yogaRoutes from './fastify/yoga'
import { setupYoga } from './graphql/yoga'
import { getStudioConfig, getWebConfig } from './lib/config'
import { rewriteWebToUsePort } from './lib/rewriteWebToUsePort'
import {
  registerMailRelatedWatchers,
  startServer as startMailServer,
  stopServer as stopMailServer,
} from './mail'
import { runMigrations } from './migrations'

const HOST = 'localhost'

let fastify: FastifyInstance

export const start = async (
  { open: autoOpen }: { open: boolean } = { open: false }
) => {
  process.on('SIGTERM', async () => {
    await stop()
  })
  process.on('SIGINT', async () => {
    await stop()
  })
  process.on('beforeExit', async () => {
    await stop()
  })

  // DB Setup
  await runMigrations()

  // Fasitfy Setup
  fastify = Fastify({
    logger: {
      level: 'info',
      timestamp: () => `,"time":"${new Date(Date.now()).toISOString()}"`,
    },
    disableRequestLogging: true,
  })

  // Plugins

  // Graphql Proxy - Takes studio "/proxies/graphql" and forwards to the projects graphql endpoint
  const webConfig = getWebConfig()
  const graphqlEndpoint =
    webConfig.apiGraphQLUrl ??
    `http://${webConfig.host}:${webConfig.port}${webConfig.apiUrl}/graphql`
  fastify = await withApiProxy(fastify, {
    apiHost: `http://${webConfig.host}:${webConfig.port}`,
    apiUrl: `/proxies/graphql`,
    // Strip the initial scheme://host:port from the graphqlEndpoint
    rewritePrefix: '/' + graphqlEndpoint.split('/').slice(3).join('/'),
  })

  const studioPort = getStudioConfig().basePort
  const webPath = path.join(__dirname, '..', '..', 'dist', 'web')

  rewriteWebToUsePort(webPath, studioPort)

  // GraphQL
  const yogaServer = setupYoga(fastify)

  // Routes
  fastify.register(spanRoutes)
  fastify.register(yogaRoutes, { yoga: yogaServer })
  // Statically serve the web side (React)
  fastify.register(fastifyStatic, { root: webPath })

  fastify.listen({ port: studioPort, host: HOST })
  fastify.ready(() => {
    console.log(`Studio API listening on ${HOST}:${studioPort}`)

    if (autoOpen) {
      open(`http://${HOST}:${studioPort}`)
    }
  })

  // SMTP Server
  console.log("Starting Studio's SMTP Server...")
  startMailServer()
  registerMailRelatedWatchers()
}

const stop = async () => {
  await fastify?.close()
  await stopMailServer()
}
