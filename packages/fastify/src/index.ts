import type { FastifyServerOptions } from 'fastify'
import Fastify from 'fastify'

import { loadFastifyConfig, DEFAULT_REDWOOD_FASTIFY_CONFIG } from './config.js'

// NOTE: Needed for backwards compatibility in the CLI.
export function createFastifyInstance(options?: FastifyServerOptions) {
  const { config } = loadFastifyConfig()
  return Fastify(options || config || DEFAULT_REDWOOD_FASTIFY_CONFIG)
}

export { redwoodFastifyAPI } from './api.js'
export { redwoodFastifyWeb } from './web.js'
export { redwoodFastifyGraphQLServer } from './graphql.js'

export type * from './types.js'

export { DEFAULT_REDWOOD_FASTIFY_CONFIG } from './config.js'

/**
 * Ensures that `path` starts and ends with a slash ('/')
 */
export function coerceRootPath(path: string) {
  const prefix = path.charAt(0) !== '/' ? '/' : ''
  const suffix = path.charAt(path.length - 1) !== '/' ? '/' : ''

  return `${prefix}${path}${suffix}`
}
