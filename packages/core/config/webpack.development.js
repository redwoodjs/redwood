const escapeRegExp = require('lodash.escaperegexp')
const { merge } = require('webpack-merge')

const { getConfig } = require('@redwoodjs/internal')

const webpackConfig = require('./webpack.common')

const { mergeUserWebpackConfig } = webpackConfig
const redwoodConfig = getConfig()

const getProxyConfig = () => {
  const { apiUrl } = redwoodConfig.web
  const { port } = redwoodConfig.api

  if (apiUrl.startsWith('/')) {
    // Redwood only proxies absolute paths.
    return {
      [apiUrl]: {
        target: `${process.env.RWJS_DEV_API_URL ?? 'http://[::1]'}:${port}`,
        pathRewrite: {
          // Eg: Rewrite `/.netlify/functions/graphql` to `/graphql`, which the api-server expects
          [`^${escapeRegExp(apiUrl)}`]: '',
        },
        headers: {
          Connection: 'keep-alive',
        },
        onError: function (err, req, res) {
          if (err.code === 'ECONNRESET' || err.code === 'ECONNREFUSED') {
            const msg = {
              errors: [
                {
                  message:
                    'The RedwoodJS API server is not available or is currently reloading. Please refresh.',
                },
              ],
            }
            // https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/503
            // The HyperText Transfer Protocol (HTTP) 503 Service Unavailable server error response code indicates that the server is not ready to handle the request.
            res.writeHead(503, {
              'Content-Type': 'application/json',
              'Retry-After': 10,
            })
            res.write(JSON.stringify(msg))
            res.end()
          } else {
            const msg = {
              errors: [
                {
                  message:
                    'An error occurred. Please try restarting your RedwoodJS api server.',
                },
              ],
            }
            res.writeHead(500, { 'Content-Type': 'application/json' })
            res.write(JSON.stringify(msg))
            res.end()
          }
        },
      },
    }
  }

  if (apiUrl.includes('://')) {
    // A developer may want to point their development environment to a staging or production GraphQL server.
    // They have specified an absolute URI,
    // which would contain `://`, `http://`, or `https://`
    //
    // So don't proxy anything.
    return undefined
  }

  console.error('Error: `apiUrl` is configured incorrectly.')
  console.error(
    'It should be an absolute path (thats starts with `/`) or an absolute URI that starts with `http[s]://`'
  )
  process.exit(1)
}

/** @type {import('webpack').Configuration} */
const baseConfig = merge(webpackConfig('development'), {
  devServer: {
    // https://webpack.js.org/configuration/dev-server/
    // note: docs not yet updated for webpack-dev-server v4
    devMiddleware: {
      writeToDisk: false,
    },
    compress: true,
    historyApiFallback: {
      disableDotRule: true,
    },
    host: redwoodConfig.web.host || 'localhost',
    port: redwoodConfig.web.port,
    proxy: getProxyConfig(),
    open: redwoodConfig.browser.open,
  },
  watchOptions: {
    ignored: ['**/*.d.ts'],
  },
  optimization: {
    removeAvailableModules: false,
    removeEmptyChunks: false,
    splitChunks: false,
  },
  infrastructureLogging: {
    level: 'error', // new in v4; previously we used quiet
  },
  ...(process.env.RWJS_WATCH_NODE_MODULES === '1' && {
    snapshot: {
      managedPaths: [],
    },
  }),
  // TODO plugin does not yet work with Webpack 5: https://github.com/smooth-code/error-overlay-webpack-plugin/issues/67
  // plugins: [new ErrorOverlayPlugin()].filter(Boolean),
  // webpack-dev-server v4 enables an overlay by default, it's just not as pretty
})

module.exports = mergeUserWebpackConfig('development', baseConfig)
