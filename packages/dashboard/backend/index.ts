import Fastify from 'fastify'
import type { FastifyInstance } from 'fastify'
// import open from 'open'

import { setupTables, setupViews } from './database'
import reactRoutes from './fastify/react'
import spanRoutes from './fastify/spanIngester'
import yogaRoutes from './fastify/yoga'
import { setupYoga } from './graphql/yoga'

const HOST = 'localhost'
const PORT = 4318

let fastify: FastifyInstance

export const start = async () => {
  fastify = Fastify({
    logger: {
      level: 'info',
      timestamp: () => `,"time":"${new Date(Date.now()).toISOString()}"`,
    },
    disableRequestLogging: true,
  })

  await setupTables()
  await setupViews()

  const yogaServer = setupYoga(fastify)
  fastify.register(spanRoutes)
  fastify.register(yogaRoutes, { yoga: yogaServer })
  fastify.register(reactRoutes)

  fastify.listen({ port: PORT, host: HOST })
  fastify.ready(() => {
    console.log(`Dashboard API listening on ${HOST}:${PORT}`)

    // TODO: Disabled for my own sanity but should enable for users
    // open(`http://${HOST}:${PORT}`)
  })

  process.on('SIGTERM', async () => {
    await stop()
  })
  process.on('SIGINT', async () => {
    await stop()
  })
  process.on('beforeExit', async () => {
    await stop()
  })
}

const stop = async () => {
  await fastify?.close()
}
