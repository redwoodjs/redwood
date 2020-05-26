const merge = require('webpack-merge')
const escapeRegExp = require('lodash.escaperegexp')
const { getConfig } = require('@redwoodjs/internal')
const ErrorOverlayPlugin = require('error-overlay-webpack-plugin')

const webpackConfig = require('./webpack.common')

const { mergeUserWebpackConfig } = webpackConfig
const redwoodConfig = getConfig()

const baseConfig = merge(webpackConfig('development'), {
  devServer: {
    // https://webpack.js.org/configuration/dev-server/
    hot: true,
    writeToDisk: false,
    compress: true,
    quiet: true,
    historyApiFallback: true,
    host: redwoodConfig.web.host || 'localhost',
    port: redwoodConfig.web.port,
    proxy: {
      [redwoodConfig.web.apiProxyPath]: {
        target: `http://localhost:${redwoodConfig.api.port}`,
        pathRewrite: {
          [`^${escapeRegExp(redwoodConfig.web.apiProxyPath)}`]: '',
        },
      },
    },
    inline: true,
    overlay: true,
    // checks for override in redwood.toml, defaults to true
    open: redwoodConfig.browser ? redwoodConfig.browser.open : false,
  },
  optimization: {
    removeAvailableModules: false,
    removeEmptyChunks: false,
    splitChunks: false,
  },
  plugins: [new ErrorOverlayPlugin()],
})

module.exports = mergeUserWebpackConfig('development', baseConfig)
