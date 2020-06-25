const { getPaths } = require('@redwoodjs/internal')

const { getSharedPlugins } = require('../webpack.common')

module.exports = {
  stories: [`${getPaths().web.src}/**/*.stories.{tsx,jsx,js}`],
  webpackFinal: (storyBookConfig, { configType }) => {
    const isEnvProduction = configType === 'production'

    const ourWebpackConfig = isEnvProduction
      ? require('../webpack.production')
      : require('../webpack.development')

    const { mode, bail, devtool, entry, output, optimization } = storyBookConfig

    const newConfig = {
      ...ourWebpackConfig,
      mode,
      bail,
      devtool,
      entry,
      output,
      optimization,
    }

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
