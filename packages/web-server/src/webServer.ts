import Fastify from 'fastify'
import type { FastifyServerOptions } from 'fastify'

import { redwoodFastifyWeb } from '@redwoodjs/fastify-web'
import type { RedwoodFastifyWebOptions } from '@redwoodjs/fastify-web'

type ServeWebOptions = {
  logger?: FastifyServerOptions['logger']
  port?: number
  host?: string
} & RedwoodFastifyWebOptions['redwood']

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

  await fastify.listen({
    port: options.port,
    host: options.host,
  })
}
