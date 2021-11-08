import { FastifyInstance } from 'fastify'
import httpProxy, { FastifyHttpProxyOptions } from 'fastify-http-proxy'

interface ApiProxyOptions {
  apiUrl: string
  apiHost: string
}

const withApiProxy = (
  app: FastifyInstance,
  { apiUrl, apiHost }: ApiProxyOptions
) => {
  const proxyOpts: FastifyHttpProxyOptions = {
    upstream: apiHost,
    prefix: apiUrl,
    disableCache: true,
  }

  app.register(httpProxy, proxyOpts)

  return app
}

export default withApiProxy
