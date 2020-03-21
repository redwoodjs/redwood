const webpackConfig = require('./webpack.common')
const { mergeUserWebpackConfig } = require('@redwoodjs/internal')
const baseConfig = webpackConfig('production')

module.exports = mergeUserWebpackConfig('production', baseConfig)
