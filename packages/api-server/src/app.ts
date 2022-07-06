import Fastify, { FastifyInstance, FastifyServerOptions } from 'fastify'

const DEFAULT_OPTIONS = {
  logger: {
    level: process.env.NODE_ENV === 'development' ? 'debug' : 'warn',
  },
}

export const createApp = (options?: FastifyServerOptions): FastifyInstance => {
  const app = Fastify(options || DEFAULT_OPTIONS)

  app.ready(() => {
    app.log.info(`Registered plugins \n${app.printPlugins()}`)
  })

  return app
}

export default createApp
