/* eslint-disable import/no-extraneous-dependencies */
const path = require('path')
const { existsSync } = require('fs')

const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const CopyPlugin = require('copy-webpack-plugin')
const { RetryChunkLoadPlugin } = require('webpack-retry-chunk-load-plugin')
const Dotenv = require('dotenv-webpack')
const { getConfig, getPaths } = require('@redwoodjs/internal')
const merge = require('webpack-merge')

const redwoodConfig = getConfig()
const redwoodPaths = getPaths()

const getEnvVars = () => {
  const redwoodEnvPrefix = 'REDWOOD_ENV_'
  const includeEnvKeys = redwoodConfig.web.includeEnvironmentVariables
  const redwoodEnvKeys = Object.keys(process.env).reduce((prev, next) => {
    if (
      next.startsWith(redwoodEnvPrefix) ||
      (includeEnvKeys && includeEnvKeys.includes(next))
    ) {
      prev[`process.env.${next}`] = JSON.stringify(process.env[next])
    }
    return prev
  }, {})

  return redwoodEnvKeys
}

const getStyleLoaders = (isEnvProduction) => {
  const styleOrExtractLoader = isEnvProduction
    ? MiniCssExtractPlugin.loader
    : 'style-loader'

  const cssLoader = (withModules, importLoaders) => {
    // Obscured classnames in production, more expressive classnames in development.
    const localIdentName = isEnvProduction
      ? '[hash:base64]'
      : '[path][name]__[local]--[hash:base64:5]'

    const loaderConfig = {
      loader: 'css-loader',
      options: {
        sourceMap: !isEnvProduction,
        importLoaders,
      },
    }

    // Enables CSS modules
    if (withModules) {
      loaderConfig.options.modules = { localIdentName }
    }

    return loaderConfig
  }

  const redwoodPaths = getPaths()
  const hasPostCssConfig = existsSync(redwoodPaths.web.postcss)

  // We only use the postcss-loader if there is a postcss config file
  // at web/config/postcss.config.js
  const postCssLoader = hasPostCssConfig
    ? {
        loader: 'postcss-loader',
        options: {
          postcssOptions: {
            config: redwoodPaths.web.postcss,
          },
        },
      }
    : null

  const numImportLoadersForCSS = hasPostCssConfig ? 1 : 0
  const numImportLoadersForSCSS = hasPostCssConfig ? 2 : 1

  return [
    {
      test: /\.module\.css$/,
      loader: [
        styleOrExtractLoader,
        cssLoader(true, numImportLoadersForCSS),
        postCssLoader,
      ].filter(Boolean),
    },
    {
      test: /\.css$/,
      loader: [
        styleOrExtractLoader,
        cssLoader(false, numImportLoadersForCSS),
        postCssLoader,
      ].filter(Boolean),
      sideEffects: true,
    },
    {
      test: /\.module\.scss$/,
      loader: [
        styleOrExtractLoader,
        cssLoader(true, numImportLoadersForSCSS),
        postCssLoader,
        'sass-loader',
      ].filter(Boolean),
    },
    {
      test: /\.scss$/,
      loader: [
        styleOrExtractLoader,
        cssLoader(false, numImportLoadersForSCSS),
        postCssLoader,
        'sass-loader',
      ].filter(Boolean),
      sideEffects: true,
    },
  ]
}

const getSharedPlugins = (isEnvProduction) => {
  return [
    isEnvProduction &&
      new MiniCssExtractPlugin({
        filename: 'static/css/[name].[contenthash:8].css',
        chunkFilename: 'static/css/[name].[contenthash:8].css',
      }),
    new webpack.ProvidePlugin({
      React: 'react',
      PropTypes: 'prop-types',
      gql: ['@redwoodjs/web', 'gql'],
      mockGraphQLQuery: ['@redwoodjs/testing', 'mockGraphQLQuery'],
      mockGraphQLMutation: ['@redwoodjs/testing', 'mockGraphQLMutation'],
    }),
    // The define plugin will replace these keys with their values during build
    // time.
    new webpack.DefinePlugin({
      __REDWOOD__: JSON.stringify(true),
      __REDWOOD__API_PROXY_PATH: JSON.stringify(redwoodConfig.web.apiProxyPath),
      ...getEnvVars(),
    }),
    new Dotenv({
      path: path.resolve(redwoodPaths.base, '.env'),
      silent: true,
    }),
  ].filter(Boolean)
}

// I've borrowed and learnt extensively from the `create-react-app` repo:
// https://github.com/facebook/create-react-app/blob/master/packages/react-scripts/config/webpack.config.js
module.exports = (webpackEnv) => {
  const isEnvProduction = webpackEnv === 'production'

  return {
    mode: isEnvProduction ? 'production' : 'development',
    devtool: isEnvProduction ? 'source-map' : 'cheap-module-source-map',
    entry: {
      app: path.resolve(redwoodPaths.base, 'web/src/index'),
    },
    resolve: {
      extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
      alias: {
        // https://www.styled-components.com/docs/faqs#duplicated-module-in-node_modules
        'styled-components': path.resolve(
          redwoodPaths.base,
          'node_modules',
          'styled-components'
        ),
        react: path.resolve(redwoodPaths.base, 'node_modules', 'react'),
      },
    },
    plugins: [
      !isEnvProduction && new webpack.HotModuleReplacementPlugin(),
      new HtmlWebpackPlugin({
        title: path.basename(redwoodPaths.base),
        template: path.resolve(redwoodPaths.base, 'web/src/index.html'),
        inject: true,
        chunks: 'all',
      }),
      new CopyPlugin({
        patterns: [
          { from: 'public/', to: '', globOptions: { ignore: ['README.md'] } },
        ],
      }),
      isEnvProduction &&
        new RetryChunkLoadPlugin({
          cacheBust: `function() {
					return Date.now();
				}`,
          maxRetries: 5,
          // @TODO: Add redirect to fatalErrorPage
          // lastResortScript: "window.location.href='/500.html';"
        }),
      ...getSharedPlugins(isEnvProduction),
    ].filter(Boolean),
    module: {
      rules: [
        // ** NOTE ** People usually overwrite these loaders via index,
        // so it's important to try and keep those indexes stable.
        {
          oneOf: [
            // (0)
            {
              test: [/\.bmp$/, /\.gif$/, /\.jpe?g$/, /\.png$/],
              use: [
                {
                  loader: 'url-loader',
                  options: {
                    limit: '10000',
                    name: 'static/media/[name].[hash:8].[ext]',
                  },
                },
              ],
            },
            // (1)
            {
              test: /\.(js|mjs|jsx|ts|tsx)$/,
              exclude: /(node_modules)/,
              use: {
                loader: 'babel-loader',
              },
            },
            // (2)
            {
              test: /\.svg$/,
              loader: 'svg-react-loader',
            },
            // .module.css (3), .css (4), .module.scss (5), .scss (6)
            ...getStyleLoaders(isEnvProduction),
            // (7)
            {
              test: /\.(svg|ico|jpg|jpeg|png|gif|eot|otf|webp|ttf|woff|woff2|cur|ani|pdf)(\?.*)?$/,
              loader: 'file-loader',
              options: {
                name: 'static/media/[name].[hash:8].[ext]',
              },
            },
          ],
        },
      ],
    },
    optimization: {
      splitChunks: {
        chunks: 'all',
        name: 'vendors',
      },
      runtimeChunk: {
        name: (entrypoint) => `runtime-${entrypoint.name}`,
      },
    },
    output: {
      pathinfo: true,
      filename: isEnvProduction
        ? 'static/js/[name].[contenthash:8].js'
        : 'static/js/[name].bundle.js',
      chunkFilename: isEnvProduction
        ? 'static/js/[name].[contenthash:8].chunk.js'
        : 'static/js/[name].chunk.js',
      path: path.resolve(redwoodPaths.base, 'web/dist'),
      publicPath: '/',
      devtoolModuleFilenameTemplate: isEnvProduction
        ? (info) =>
            path
              .relative(redwoodPaths.web.src, info.absoluteResourcePath)
              .replace(/\\/g, '/')
        : (info) => path.resolve(info.absoluteResourcePath).replace(/\\/g, '/'),
    },
  }
}

module.exports.mergeUserWebpackConfig = (mode, baseConfig) => {
  const redwoodPaths = getPaths()
  const hasCustomConfig = existsSync(redwoodPaths.web.webpack)
  if (!hasCustomConfig) {
    return baseConfig
  }
  const userWebpackConfig = require(redwoodPaths.web.webpack)

  if (typeof userWebpackConfig === 'function') {
    return userWebpackConfig(baseConfig, { mode })
  }

  return merge(baseConfig, userWebpackConfig)
}

module.exports.getEnvVars = getEnvVars
module.exports.getSharedPlugins = getSharedPlugins
module.exports.getStyleLoaders = getStyleLoaders
