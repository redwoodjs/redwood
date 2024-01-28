import type { FastifyServerOptions } from 'fastify'
import Fastify from 'fastify'

import { loadFastifyConfig, DEFAULT_REDWOOD_FASTIFY_CONFIG } from './config.js'

// NOTE: Needed for backwards compatibility in the CLI.
export function createFastifyInstance(options?: FastifyServerOptions) {
  const { config } = loadFastifyConfig()
  return Fastify(options || config || DEFAULT_REDWOOD_FASTIFY_CONFIG)
}

export { redwoodFastifyAPI } from './api.js'

export type * from './types.js'

export { DEFAULT_REDWOOD_FASTIFY_CONFIG } from './config.js'
