/* eslint-disable import/no-extraneous-dependencies */
const path = require('path')

const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const DirectoryNamedWebpackPlugin = require('directory-named-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const FaviconsWebpackPlugin = require('favicons-webpack-plugin')
const Dotenv = require('dotenv-webpack')
const { getConfig, getPaths } = require('@redwoodjs/core')

const redwoodConfig = getConfig()
const redwoodPaths = getPaths()

// I've borrowed and learnt extensively from the `create-react-app` repo:
// https://github.com/facebook/create-react-app/blob/master/packages/react-scripts/config/webpack.config.js
module.exports = (webpackEnv) => {
  const isEnvProduction = webpackEnv === 'production'

  const getStyleLoaders = () => {
    return [
      {
        test: /\.scss$/,
        use: [
          isEnvProduction ? MiniCssExtractPlugin.loader : 'style-loader',
          'css-loader',
          'sass-loader',
        ],
      },
      {
        test: /\.css$/,
        use: [
          isEnvProduction ? MiniCssExtractPlugin.loader : 'style-loader',
          'css-loader',
        ],
      },
    ]
  }

  return {
    mode: isEnvProduction ? 'production' : 'development',
    devtool: isEnvProduction ? 'source-map' : 'cheap-module-source-map',
    entry: {
      app: path.resolve(redwoodPaths.base, 'web/src/index.js'),
    },
    resolve: {
      extensions: ['.ts', '.tsx', '.js', '.json'],
      plugins: [
        new DirectoryNamedWebpackPlugin({
          honorIndex: true,
          exclude: /node_modules/,
        }),
      ],
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
      isEnvProduction &&
        new MiniCssExtractPlugin({
          filename: '[name].[contenthash:8].css',
          chunkFilename: '[name].[contenthash:8].css',
        }),
      !isEnvProduction && new webpack.HotModuleReplacementPlugin(),
      new HtmlWebpackPlugin({
        template: path.resolve(redwoodPaths.base, 'web/src/index.html'),
      }),
      new webpack.ProvidePlugin({
        React: 'react',
        PropTypes: 'prop-types',
        gql: ['@redwoodjs/web', 'gql'],
        __REDWOOD__: ['@redwoodjs/web', '__REDWOOD__'],
      }),
      // The define plugin will replace these keys with their values during build
      // time.
      new webpack.DefinePlugin({
        __REDWOOD__API_PROXY_PATH: JSON.stringify(
          redwoodConfig.web.apiProxyPath
        ),
        __filename: webpack.DefinePlugin.runtimeValue((runtimeValue) => {
          // absolute path of imported file
          return JSON.stringify(runtimeValue.module.resource)
        }),
      }),
      new FaviconsWebpackPlugin(
        path.resolve(redwoodPaths.base, 'web/src/favicon.png')
      ),
      new Dotenv({
        path: path.resolve(redwoodPaths.base, '.env'),
        silent: true,
      }),
      new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
    ].filter(Boolean),
    module: {
      rules: [
        {
          oneOf: [
            {
              test: /\.(png|jpg|gif)$/,
              use: [
                {
                  loader: 'url-loader',
                  options: {
                    limit: '10000',
                    name: '[name].[hash:8].[ext]',
                  },
                },
              ],
            },
            {
              loader: 'null-loader',
              test: /\.(md|test\.js|stories\.js)$/,
            },
            {
              test: /\.(js|jsx|ts|tsx)$/,
              exclude: /(node_modules)/,
              use: {
                loader: 'babel-loader',
                options: {
                  presets: ['@babel/preset-env'],
                  cacheDirectory: true,
                },
              },
            },
            {
              test: /\.svg$/,
              loader: 'svg-react-loader',
            },
            ...getStyleLoaders(),
            {
              loader: 'file-loader',
              exclude: [/\.(js|mjs|jsx|ts|tsx)$/, /\.html$/, /\.json$/],
              options: {
                name: '[name].[hash:8].[ext]',
              },
            },
          ],
        },
        {
          test: redwoodPaths.web.routes,
          use: {
            loader: path.resolve(
              __dirname,
              '..',
              'dist',
              'loaders',
              'routes-auto-loader'
            ),
          },
        },
      ],
    },
    optimization: {
      splitChunks: {
        chunks: 'all',
        name: false,
      },
      runtimeChunk: {
        name: (entrypoint) => `runtime-${entrypoint.name}`,
      },
    },
    output: {
      pathinfo: true,
      filename: isEnvProduction
        ? '[name].[contenthash:8].js'
        : '[name].bundle.js',
      chunkFilename: isEnvProduction
        ? '[name].[contenthash:8].chunk.js'
        : '[name].chunk.js',
      path: path.resolve(redwoodPaths.base, 'web/dist'),
      publicPath: '/',
      devtoolModuleFilenameTemplate: isEnvProduction
        ? (info) =>
            path
              .relative(redwoodPaths.web, 'src', info.absoluteResourcePath)
              .replace(/\\/g, '/')
        : (info) => path.resolve(info.absoluteResourcePath).replace(/\\/g, '/'),
    },
  }
}
