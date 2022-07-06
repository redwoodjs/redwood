import httpProxy, { FastifyHttpProxyOptions } from '@fastify/http-proxy'
import { FastifyInstance } from 'fastify'

import { registerProxyPlugins } from './utils'

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

  registerProxyPlugins(app)

  return app
}

export default withApiProxy
