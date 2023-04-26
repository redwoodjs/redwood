import type { FastifyServerOptions } from 'fastify'
import Fastify from 'fastify'

import { DEFAULT_REDWOOD_FASTIFY_CONFIG } from './config.js'

export function createFastifyInstance(options?: FastifyServerOptions) {
  return Fastify(options || DEFAULT_REDWOOD_FASTIFY_CONFIG)
}

export { redwoodFastifyAPI } from './api.js'
export { redwoodFastifyWeb } from './web.js'
