import Fastify, { FastifyInstance } from 'fastify'

export const createApp = (): FastifyInstance => {
  const app = Fastify({
    logger: {
      prettyPrint: process.env.NODE_ENV === 'development' && {
        colorize: true,
        ignore: 'hostname,pid,responseTime,reqId,req,res',
        levelFirst: true,
        messageFormat:
          '{reqId} {msg} {res.statusCode} {req.method} {responseTime}',
        translateTime: true,
      },
    },
  })

  return app
}

export default createApp
