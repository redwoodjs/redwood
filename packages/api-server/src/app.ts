import crypto from 'crypto'

import Fastify, { FastifyInstance } from 'fastify'

export const createApp = (): FastifyInstance => {
  const app = Fastify({
    genReqId: (req) => {
      return (
        crypto
          .randomBytes(12)
          .toString('hex')
          .match(/.{1,8}/g)
          ?.join('-') || req.ip
      )
    },
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
