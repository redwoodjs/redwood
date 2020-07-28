const path = require('path')

const { getPaths } = require('@redwoodjs/internal')
const { getSharedPlugins } = require('../webpack.common')

module.exports = {
  stories: [`${getPaths().web.src}/**/*.stories.{tsx,jsx,js}`],
  webpackFinal: (sbConfig, { configType }) => {
    const isEnvProduction = configType === 'production'

    const rwConfig = isEnvProduction
      ? require('../webpack.production')
      : require('../webpack.development')

    // We replace imports to "@redwoodjs/router" with our own implementation in "@redwoodjs/testing"
    sbConfig.resolve.alias['@redwoodjs/router$'] = path.join(getPaths().base, 'node_modules/@redwoodjs/testing/dist/MockRouter.js')
    sbConfig.resolve.alias['~__REDWOOD__USER_ROUTES_FOR_MOCK'] = getPaths().web.routes
    sbConfig.resolve.alias['~__REDWOOD__USER_WEB_SRC'] = getPaths().web.src
    sbConfig.resolve.alias['~__REDWOOD__USER_WEB_DEFAULT_CSS'] = path.join(getPaths().web.src, 'index.css')
    sbConfig.resolve.extensions = rwConfig.resolve.extensions
    sbConfig.resolve.plugins = rwConfig.resolve.plugins // Directory Named Plugin

    // ** PLUGINS **
    sbConfig.plugins = [
      ...sbConfig.plugins,
      ...getSharedPlugins(isEnvProduction),
    ]

    // ** LOADERS **
    sbConfig.module.rules = rwConfig.module.rules

    // Performance Improvements:
    // https://webpack.js.org/guides/build-performance/#avoid-extra-optimization-steps
    sbConfig.optimization = {
      removeAvailableModules: false,
      removeEmptyChunks: false,
      splitChunks: false,
    }
    // https://webpack.js.org/guides/build-performance/#output-without-path-info
    sbConfig.output.pathinfo = false

    return sbConfig
  },
}
