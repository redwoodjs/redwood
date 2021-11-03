import Fastify, { FastifyInstance } from 'fastify'

export const createApp = (): FastifyInstance => {
  const app = Fastify({
    logger: { prettyPrint: process.env.NODE_ENV !== 'production' },
  })

  return app
}

export default createApp
