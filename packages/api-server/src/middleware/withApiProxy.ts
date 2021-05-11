import type { Application } from 'express'
import { createProxyMiddleware } from 'http-proxy-middleware'

interface ApiProxyOptions {
  apiProxyPath: string
  apiHost?: string
}

const withApiProxy = (
  app: Application,
  { apiProxyPath, apiHost }: ApiProxyOptions
) => {
  // If apiHost is supplied, it means the functions are running elsewhere
  // So we should just proxy requests
  if (apiHost) {
    app.use(
      createProxyMiddleware(apiProxyPath, {
        changeOrigin: true,
        pathRewrite: {
          [`^${apiProxyPath}`]: '/', // remove base path
        },
        target: apiHost,
      })
    )
  }

  return app
}

export default withApiProxy
