import Fastify from 'fastify'
// import open from 'open'

import { setupTables } from './database'
import reactRoutes from './fastify/react'
import spanRoutes from './fastify/spanIngester'
import yogaRoutes from './fastify/yoga'
import { setupYoga } from './graphql/yoga'

const HOST = 'localhost'
const PORT = 4318

export const start = async () => {
  const fastify = Fastify({
    logger: {
      level: 'info',
      timestamp: () => `,"time":"${new Date(Date.now()).toISOString()}"`,
    },
    disableRequestLogging: true,
  })

  await setupTables()

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
  process.on('exit', () => {
    fastify?.close()
  })
}
