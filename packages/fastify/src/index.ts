import type { FastifyServerOptions } from 'fastify'
import Fastify from 'fastify'

import { DEFAULT_REDWOOD_FASTIFY_CONFIG, loadFastifyConfig } from './config.js'

export function createFastifyInstance(options?: FastifyServerOptions) {
  const { config } = loadFastifyConfig()
  return Fastify(options || config || DEFAULT_REDWOOD_FASTIFY_CONFIG)
}

export { redwoodFastifyAPI } from './api.js'
export { redwoodFastifyWeb } from './web.js'

export type * from './types.js'
