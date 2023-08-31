import httpProxy, { FastifyHttpProxyOptions } from '@fastify/http-proxy'
import { FastifyInstance } from 'fastify'

export interface ApiProxyOptions {
  apiUrl: string
  apiHost: string
  rewritePrefix?: string
}

const withApiProxy = async (
  fastify: FastifyInstance,
  { apiUrl, apiHost, rewritePrefix }: ApiProxyOptions
) => {
  const proxyOpts: FastifyHttpProxyOptions = {
    upstream: apiHost,
    prefix: apiUrl,
    rewritePrefix,
    disableCache: true,
  }

  fastify.register(httpProxy, proxyOpts)

  return fastify
}

export default withApiProxy
