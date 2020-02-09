/* eslint-disable prettier/prettier */
/* eslint-disable import/no-extraneous-dependencies */
const merge = require('webpack-merge')
const escapeRegExp = require('lodash.escaperegexp')
const { getConfig } = require('@redwoodjs/core')

const webpackConfig = require('./webpackConfig.js')

// this is the parsed redwood.toml
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
    open: redwoodConfig?.browser?.open ? redwoodConfig.browser.open : true,
  },
  optimization: {
    removeAvailableModules: false,
    removeEmptyChunks: false,
    splitChunks: false,
  },
})
