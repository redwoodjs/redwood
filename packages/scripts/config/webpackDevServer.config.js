/* eslint-disable import/no-extraneous-dependencies */
const merge = require('webpack-merge')
const escapeRegExp = require('lodash.escaperegexp')
const { getConfig } = require('@redwoodjs/core')

const webpackConfig = require('./webpack.config.js')

const redwoodConfig = getConfig()

module.exports = merge(webpackConfig('development'), {
  devServer: {
    // https://webpack.js.org/configuration/dev-server/
    hot: true,
    writeToDisk: false,
    compress: true,
    clientLogLevel: 'none',
    transportMode: 'ws',
    injectClient: false,
    quiet: true,
    historyApiFallback: true,
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
  },
  optimization: {
    removeAvailableModules: false,
    removeEmptyChunks: false,
    splitChunks: false,
  },
})
