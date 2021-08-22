const escapeRegExp = require('lodash.escaperegexp')
const { merge } = require('webpack-merge')

const { getConfig } = require('@redwoodjs/internal')

const webpackConfig = require('./webpack.common')

const { mergeUserWebpackConfig } = webpackConfig
const redwoodConfig = getConfig()

const getProxyConfig = () => {
  const { apiURL } = redwoodConfig.web
  const { port } = redwoodConfig.api

  if (apiURL.startsWith('/')) {
    // Redwood only proxies absolute paths.
    return {
      [apiURL]: {
        target: `http://[::1]:${port}`,
        pathRewrite: {
          // Eg: Rewrite `/.netlify/functions/graphql` to `/graphql`, which the api-server expects
          [`^${escapeRegExp(apiURL)}`]: '',
        },
        headers: {
          Connection: 'keep-alive',
        },
      },
    }
  }

  if (apiURL.includes('://')) {
    // A developer may want to point their development environment to a staging or production GraphQL server.
    // They have specified an absolute URI,
    // which would contain `://`, `http://`, or `https://`
    //
    // So don't proxy anything.
    return undefined
  }

  console.error('Error: `apiURL` is configured incorrectly.')
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
    historyApiFallback: true,
    host: redwoodConfig.web.host || 'localhost',
    port: redwoodConfig.web.port,
    proxy: getProxyConfig(),
    inline: true,
    overlay: true,
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
  // TODO plugin does not yet work with Webpack 5: https://github.com/smooth-code/error-overlay-webpack-plugin/issues/67
  // plugins: [new ErrorOverlayPlugin()].filter(Boolean),
  // webpack-dev-server v4 enables an overlay by default, it's just not as pretty
})

module.exports = mergeUserWebpackConfig('development', baseConfig)
