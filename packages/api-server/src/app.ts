import Fastify, { FastifyInstance } from 'fastify'

export const createApp = (): FastifyInstance => {
  const app = Fastify({
    logger: {
      // These settings are identical to the default Redwood logger
      prettyPrint: process.env.NODE_ENV === 'development' && {
        colorize: true,
        ignore: 'hostname,pid',
        levelFirst: true,
        messageFormat: false,
        translateTime: true,
      },
    },
  })

  return app
}

export default createApp
