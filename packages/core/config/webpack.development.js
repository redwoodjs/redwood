/* eslint-disable import/no-extraneous-dependencies */
const merge = require('webpack-merge')
const escapeRegExp = require('lodash.escaperegexp')
const { getConfig } = require('@redwoodjs/internal')

const webpackConfig = require('./webpack.common')
const redwoodConfig = getConfig()

module.exports = merge(webpackConfig('development'), {
  devServer: {
    // https://webpack.js.org/configuration/dev-server/
    hot: true,
    writeToDisk: false,
    compress: true,
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
    // checks for override in redwood.toml, defaults to true
    open: redwoodConfig.browser ? redwoodConfig.browser.open : false,
  },
  optimization: {
    removeAvailableModules: false,
    removeEmptyChunks: false,
    splitChunks: false,
  },
})
