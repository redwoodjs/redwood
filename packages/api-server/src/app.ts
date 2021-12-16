import Fastify, { FastifyInstance, FastifyServerOptions } from 'fastify'

export const createApp = (
  options: FastifyServerOptions = {}
): FastifyInstance => {
  const app = Fastify(options)

  return app
}

export default createApp
