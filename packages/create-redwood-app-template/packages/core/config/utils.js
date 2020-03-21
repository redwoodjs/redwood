const {getPaths} = require('@redwoodjs/internal')
const {existsSync} = require('fs')
const merge = require('webpack-merge')

module.exports['mergeUserWebpackConfig'] = (env, baseConfig) => {
  const redwoodPaths = getPaths()
  const hasCustomConfig = existsSync(redwoodPaths.web.webpack)
  if (!hasCustomConfig) {
    return baseConfig
  }
  const userWebpackConfig = require(redwoodPaths.web.webpack)

  if (typeof userWebpackConfig === 'function') {
    return userWebpackConfig(baseConfig, {env})
  }

  return merge(baseConfig, userWebpackConfig)
}
