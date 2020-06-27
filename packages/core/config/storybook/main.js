const path = require('path')

const { getPaths } = require('@redwoodjs/internal')
const { configure, addDecorator } = require('@storybook/react')

const { getSharedPlugins } = require('../webpack.common')


//

module.exports = {
  stories: [`${getPaths().web.src}/**/*.stories.{tsx,jsx,js}`],
  webpackFinal: (storyBookConfig, { configType }) => {
    const isEnvProduction = configType === 'production'

    const ourWebpackConfig = isEnvProduction
      ? require('../webpack.production')
      : require('../webpack.development')

    const { mode, devtool, entry, output, optimization } = storyBookConfig

    const newConfig = {
      ...ourWebpackConfig,
      bail: false,
      mode,
      devtool,
      entry,
      output,
      optimization,
    }

    // We replace imports to "@redwoodjs/router" with our own implementation in "@redwoodjs/testing"
    newConfig.resolve.alias['@redwoodjs/router$'] = path.join(getPaths().base,  'node_modules/@redwoodjs/testing/dist/MockRouter.js')
    newConfig.resolve.alias['~__REDWOOD__USER_ROUTES_FOR_MOCK'] = getPaths().web.routes

    // ** PLUGINS **

    newConfig.plugins = [
      ...storyBookConfig.plugins,
      ...getSharedPlugins(isEnvProduction),
    ]


    // ** LOADERS ***

    // Remove null-loader
    const nullLoaderIndex = newConfig.module.rules[0].oneOf.findIndex(
      ({ loader }) => loader === 'null-loader'
    )
    if (nullLoaderIndex >= 0) {
      newConfig.module.rules[0].oneOf.splice(nullLoaderIndex, 1)
    }
    // Add markdown-loader
    const mdxModuleRule = storyBookConfig.module.rules.filter(({ test }) => {
      return '.md'.match(test)
    })?.[0]
    newConfig.module.rules[0].oneOf.unshift(mdxModuleRule)

    return newConfig
  },
}
