const webpackConfig = require('./webpack.common')
const { mergeUserWebpackConfig } = require('./utils')

const baseConfig = webpackConfig('production')

module.exports = mergeUserWebpackConfig('production', baseConfig)
