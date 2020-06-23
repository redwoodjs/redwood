const path = require('path')

const webpack = require('webpack')
const DirectoryNamedWebpackPlugin = require('directory-named-webpack-plugin')
const Dotenv = require('dotenv-webpack')
const { getPaths } = require('@redwoodjs/internal')

const { getStyleLoaders, getSharedPlugins } = require('../webpack.common')

console.log('----------------------------------------------')
console.log('hello')
console.log('----------------------------------------------')

module.exports = {
  stories: [`${getPaths().web.src}/**/*.stories.[tj]s`],
  webpackFinal: (storyBookConfig, { configType }) => {
    const ourWebpackConfig =
      configType === 'development'
        ? require('../webpack.development')
        : require('../webpack.production')

    console.log('~~~~~~~~~~~~~~~~~~~~~~ custom webpack')
    console.log('pew pew pew')
    console.log('~~~~~~~~~~~~~~~~~~~~~~')

    // Replace Storybook Config's rules:
    const babelLoader = ourWebpackConfig.module.rules[0].oneOf[2]
    storyBookConfig.module.rules[0] = babelLoader
    storyBookConfig.module.rules = [
      ...storyBookConfig.module.rules,
      ...getStyleLoaders(configType === 'production'),
    ]

    storyBookConfig.resolve.plugins = [
      new DirectoryNamedWebpackPlugin({
        honorIndex: true,
        exclude: /node_modules/,
      }),
    ]

    storyBookConfig.plugins = [
      ...storyBookConfig.plugins,
      ...getSharedPlugins(configType === 'production'),
    ]

    return storyBookConfig
  },
}
