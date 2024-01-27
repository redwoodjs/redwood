import Fastify from 'fastify'

import { redwoodFastifyWeb } from '@redwoodjs/fastify-web'

import type { ServeWebOptions } from './types'

export { ServeWebOptions }

export async function serveWeb(options: ServeWebOptions = {}) {
  options.logger ??= {
    level:
      process.env.LOG_LEVEL ?? process.env.NODE_ENV === 'development'
        ? 'debug'
        : 'warn',
  }

  const fastify = Fastify({
    requestTimeout: 15_000,
    logger: options.logger,
  })

  await fastify.register(redwoodFastifyWeb, {
    redwood: options,
  })

  fastify.addHook('onListen', (done) => {
    const addressInfo = fastify.server.address()

    if (!addressInfo || typeof addressInfo === 'string') {
      done()
      return
    }

    fastify.log.info(
      `Listening on http://${addressInfo.address}:${addressInfo.port}`
    )
    done()
  })

  await fastify.listen({
    port: options.port,
    host: options.host,
  })
}
