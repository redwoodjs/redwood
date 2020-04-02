const webpackConfig = require('./webpack.common')
const { mergeUserWebpackConfig } = webpackConfig
const baseConfig = webpackConfig('production')

module.exports = mergeUserWebpackConfig('production', baseConfig)
