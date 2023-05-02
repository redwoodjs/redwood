export { DEFAULT_REDWOOD_FASTIFY_CONFIG } from './config.js'

// For now, we're trying...
//
// ```js
// const fastify = Fastify({
//   ...DEFAULT_REDWOOD_FASTIFY_CONFIG,
// })
// ```
//
// export function createFastifyInstance(options?: FastifyServerOptions) {
//   const { config } = loadFastifyConfig()
//   return Fastify(options || config || DEFAULT_REDWOOD_FASTIFY_CONFIG)
// }

export { redwoodFastifyAPI } from './api.js'
export { redwoodFastifyWeb } from './web.js'

export type * from './types.js'

export function coerceRootPath(path: string) {
  // Make sure that we create a root path that starts and ends with a slash (/)
  const prefix = path.charAt(0) !== '/' ? '/' : ''
  const suffix = path.charAt(path.length - 1) !== '/' ? '/' : ''

  return `${prefix}${path}${suffix}`
}
