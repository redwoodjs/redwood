const webpackConfig = require('./webpack.common')
const { mergeUserWebpackConfig } = webpackConfig
const baseConfig = webpackConfig('production')

/** @type {import('webpack').Configuration} */
module.exports = mergeUserWebpackConfig('production', baseConfig)
