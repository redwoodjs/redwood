import crypto from 'crypto'

import Fastify, { FastifyInstance } from 'fastify'

export const createApp = (): FastifyInstance => {
  const app = Fastify({
    // Note: genReqId will not be called if the header set in requestIdHeader is available
    // (defaults to 'request-id').
    genReqId: () => crypto.randomUUID(),
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
