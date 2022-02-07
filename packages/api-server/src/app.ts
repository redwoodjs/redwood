import Fastify, { FastifyInstance, FastifyServerOptions } from 'fastify'

const DEFAULT_OPTIONS = {
  logger: {
    level: process.env.NODE_ENV === 'development' ? 'debug' : 'warn',
  },
}

export const createApp = (options?: FastifyServerOptions): FastifyInstance => {
  const app = Fastify(options || DEFAULT_OPTIONS)
  app.register(require('fastify-formbody'))
  return app
}

export default createApp
