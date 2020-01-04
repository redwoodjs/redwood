/* eslint-disable import/no-extraneous-dependencies */
const merge = require('webpack-merge')
const escapeRegExp = require('lodash.escaperegexp')
const { getHammerConfig } = require('@redwoodjs/core')

const webpackConfig = require('./webpack.config.js')

const hammerConfig = getHammerConfig()

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
