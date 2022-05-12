import http from 'http'

import Fastify, { FastifyInstance, FastifyServerOptions } from 'fastify'
import pino from 'pino'

export type ServerOptionsWithPino = Omit<
  FastifyServerOptions<http.Server, pino.Logger>,
  'logger'
> & { logger?: boolean | pino.LoggerOptions }

export const DEFAULT_API_SERVER_LOGGER_NAME = 'rw-api-server'

const DEFAULT_OPTIONS: ServerOptionsWithPino = {
  logger: {
    level: process.env.NODE_ENV === 'development' ? 'debug' : 'warn',
    name: DEFAULT_API_SERVER_LOGGER_NAME,
  },
}

export const createApp = (options?: ServerOptionsWithPino): FastifyInstance => {
  const fastifyOptions: ServerOptionsWithPino = options || DEFAULT_OPTIONS

  // Merge in a default logger name unless the user has already specified a
  // logger name on their own
  if (fastifyOptions.logger === true) {
    fastifyOptions.logger = { name: DEFAULT_API_SERVER_LOGGER_NAME }
  } else if (fastifyOptions.logger) {
    fastifyOptions.logger = {
      name: DEFAULT_API_SERVER_LOGGER_NAME,
      ...fastifyOptions.logger,
    }
  }

  return Fastify(fastifyOptions)
}

export default createApp
