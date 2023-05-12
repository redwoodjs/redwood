import Fastify, { FastifyServerOptions } from 'fastify'

import { loadFastifyConfig, DEFAULT_REDWOOD_FASTIFY_CONFIG } from './config.js'

// NOTE: Needed for backwards compatibility in CLI handlers
export function createFastifyInstance(options?: FastifyServerOptions) {
  const { config } = loadFastifyConfig()
  return Fastify(options || config || DEFAULT_REDWOOD_FASTIFY_CONFIG)
}

export { redwoodFastifyAPI } from './api.js'
export { redwoodFastifyWeb } from './web.js'

export type * from './types.js'

export { DEFAULT_REDWOOD_FASTIFY_CONFIG } from './config.js'

export function coerceRootPath(path: string) {
  // Make sure that we create a root path that starts and ends with a slash (/)
  const prefix = path.charAt(0) !== '/' ? '/' : ''
  const suffix = path.charAt(path.length - 1) !== '/' ? '/' : ''

  return `${prefix}${path}${suffix}`
}
