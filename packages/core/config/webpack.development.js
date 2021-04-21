const ErrorOverlayPlugin = require('error-overlay-webpack-plugin')
const escapeRegExp = require('lodash.escaperegexp')
const { merge } = require('webpack-merge')

const { getConfig } = require('@redwoodjs/internal')

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
        target: `http://[::1]:${redwoodConfig.api.port}`,
        pathRewrite: {
          [`^${escapeRegExp(redwoodConfig.web.apiProxyPath)}`]: '',
        },
        headers: {
          Connection: 'keep-alive',
        },
      },
    },
    inline: true,
    overlay: true,
    open: redwoodConfig.browser.open,
  },
  optimization: {
    removeAvailableModules: false,
    removeEmptyChunks: false,
    splitChunks: false,
  },
  plugins: [new ErrorOverlayPlugin()].filter(Boolean),
})

/** @type {import('webpack').Configuration} */
module.exports = mergeUserWebpackConfig('development', baseConfig)
