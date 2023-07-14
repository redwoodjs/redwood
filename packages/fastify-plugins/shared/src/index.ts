import httpProxy from '@fastify/http-proxy'
import type { FastifyHttpProxyOptions } from '@fastify/http-proxy'
import type { FastifyInstance } from 'fastify'
import type { FastifyServerOptions } from 'fastify'

export const DEFAULT_REDWOOD_FASTIFY_CONFIG: FastifyServerOptions = {
  requestTimeout: 15_000,
  logger: {
    // Note: If running locally using `yarn rw serve` you may want to adust
    // the default non-development level to `info`
    level:
      process.env.LOG_LEVEL ?? process.env.NODE_ENV === 'development'
        ? 'debug'
        : 'warn',
  },
}

/**
 * Ensures that `path` starts and ends with a slash ('/')
 */
export function coerceRootPath(path: string) {
  const prefix = path.charAt(0) !== '/' ? '/' : ''
  const suffix = path.charAt(path.length - 1) !== '/' ? '/' : ''

  return `${prefix}${path}${suffix}`
}

export interface ApiProxyOptions {
  apiUrl: string
  apiHost: string
}

export async function withApiProxy(
  fastify: FastifyInstance,
  { apiUrl, apiHost }: ApiProxyOptions
) {
  const proxyOpts: FastifyHttpProxyOptions = {
    upstream: apiHost,
    prefix: apiUrl,
    disableCache: true,
  }

  fastify.register(httpProxy, proxyOpts)
  return fastify
}
