import chalk from 'chalk'
import Fastify from 'fastify'
import type { FastifyInstance } from 'fastify'
import open from 'open'

import withApiProxy from './fastify/plugins/withApiProxy'
import reactRoutes from './fastify/react'
import spanRoutes from './fastify/spanIngester'
import yogaRoutes from './fastify/yoga'
import { setupYoga } from './graphql/yoga'
import { getWebConfig } from './lib/config'
import { runMigrations } from './migrations'

const HOST = 'localhost'
const PORT = 4318

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

  // GraphQL
  const yogaServer = setupYoga(fastify)

  // Routes
  fastify.register(spanRoutes)
  fastify.register(yogaRoutes, { yoga: yogaServer })
  fastify.register(reactRoutes)

  fastify.listen({ port: PORT, host: HOST })
  fastify.ready(() => {
    console.log(
      `${chalk.hex('#ff845e')(
        `------------------------------------------------------------------\n 🧪 ${chalk.green(
          'Experimental Feature'
        )} 🧪\n------------------------------------------------------------------`
      )}`
    )
    console.log(
      `Studio is an experimental feature, please find documentation and links to provide feedback at:\n -> https://community.redwoodjs.com/t/redwood-studio-experimental/4771`
    )
    console.log(
      `${chalk.hex('#ff845e')(
        '------------------------------------------------------------------'
      )}\n`
    )
    console.log(`Studio API listening on ${HOST}:${PORT}`)

    if (autoOpen) {
      open(`http://${HOST}:${PORT}`)
    }
  })
}

const stop = async () => {
  await fastify?.close()
}
