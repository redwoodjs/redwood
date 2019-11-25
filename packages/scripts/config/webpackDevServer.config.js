/* eslint-disable import/no-extraneous-dependencies */
const path = require('path')

const merge = require('webpack-merge')
const { getHammerConfig } = require('@hammerframework/hammer-core')
const escapeRegExp = require('lodash.escaperegexp')

const webpackConfig = require('./webpack.config.js')
const hammerConfig = getHammerConfig()

module.exports = merge(webpackConfig('development'), {
  devServer: {
    hot: true,
    writeToDisk: false,
    compress: true,
    clientLogLevel: 'none',
    transportMode: 'ws',
    injectClient: false,
    quiet: true,
    historyApiFallback: true,
    port: hammerConfig.web.port,
    proxy: {
      [hammerConfig.web.apiProxyPath]: {
        target: `http://localhost:${hammerConfig.api.port}`,
        pathRewrite: {
          [`^${escapeRegExp(hammerConfig.web.apiProxyPath)}`]: '',
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
