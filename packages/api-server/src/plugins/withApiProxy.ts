import type { FastifyHttpProxyOptions } from '@fastify/http-proxy'
import httpProxy from '@fastify/http-proxy'
import type { FastifyInstance } from 'fastify'

export interface ApiProxyOptions {
  apiUrl: string
  apiHost: string
}

const withApiProxy = async (
  fastify: FastifyInstance,
  { apiUrl, apiHost }: ApiProxyOptions
) => {
  const proxyOpts: FastifyHttpProxyOptions = {
    upstream: apiHost,
    prefix: apiUrl,
    disableCache: true,
  }

  fastify.register(httpProxy, proxyOpts)

  return fastify
}

export default withApiProxy
