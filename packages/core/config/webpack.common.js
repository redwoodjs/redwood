const fs = require('fs')
const path = require('path')

const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin')
const CopyPlugin = require('copy-webpack-plugin')
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin')
const Dotenv = require('dotenv-webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const webpack = require('webpack')
const { WebpackManifestPlugin } = require('webpack-manifest-plugin')
const { merge } = require('webpack-merge')
const { RetryChunkLoadPlugin } = require('webpack-retry-chunk-load-plugin')

const { getWebSideDefaultBabelConfig } = require('@redwoodjs/babel-config')
const {
  ChunkReferencesPlugin,
} = require('@redwoodjs/internal/dist/webpackPlugins/ChunkReferencesPlugin')
const { getConfig, getPaths } = require('@redwoodjs/project-config')

const redwoodConfig = getConfig()
const redwoodPaths = getPaths()

const isUsingVite = redwoodConfig.web.bundler !== 'webpack'

/** @returns {{[key: string]: string}} Env vars */
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

/** @returns {import('webpack').RuleSetLoader[]} */
const getStyleLoaders = (isEnvProduction) => {
  const styleOrExtractLoader = isEnvProduction
    ? MiniCssExtractPlugin.loader
    : require.resolve('style-loader')

  const cssLoader = (withModules, importLoaders) => {
    // Obscured classnames in production, more expressive classnames in development.
    const localIdentName = isEnvProduction
      ? '[contenthash:base64]'
      : '[path][name]__[local]--[contenthash:base64:5]'

    const loaderConfig = {
      loader: require.resolve('css-loader'),
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

  const resolveUrlLoader = {
    loader: require.resolve('resolve-url-loader'),
    options: {
      root: path.join(redwoodPaths.web.base, '/public'),
    },
  }

  const paths = getPaths()
  const hasPostCssConfig = fs.existsSync(paths.web.postcss)

  // We only use the postcss-loader if there is a postcss config file
  // at web/config/postcss.config.js
  const postCssLoader = hasPostCssConfig
    ? {
        loader: require.resolve('postcss-loader'),
        options: {
          postcssOptions: {
            config: paths.web.postcss,
          },
          sourceMap: true, // required for resolve-url-loader
        },
      }
    : null

  const numImportLoadersForCSS = hasPostCssConfig ? 1 : 0
  const numImportLoadersForSCSS = hasPostCssConfig ? 2 : 1

  const sassLoader = {
    loader: 'sass-loader',
    options: {
      sourceMap: true, // required for resolve-url-loader
    },
  }

  return [
    {
      test: /\.module\.css$/,
      use: [
        styleOrExtractLoader,
        cssLoader(true, numImportLoadersForCSS),
        isUsingVite && resolveUrlLoader,
        postCssLoader,
      ].filter(Boolean),
    },
    {
      test: /\.css$/,
      use: [
        styleOrExtractLoader,
        cssLoader(false, numImportLoadersForCSS),
        isUsingVite && resolveUrlLoader,
        postCssLoader,
      ].filter(Boolean),
      sideEffects: true,
    },
    {
      test: /\.module\.scss$/,
      use: [
        styleOrExtractLoader,
        cssLoader(true, numImportLoadersForSCSS),
        isUsingVite && resolveUrlLoader,
        postCssLoader,
        sassLoader,
      ].filter(Boolean),
    },
    {
      test: /\.scss$/,
      use: [
        styleOrExtractLoader,
        cssLoader(false, numImportLoadersForSCSS),
        isUsingVite && resolveUrlLoader,
        postCssLoader,
        sassLoader,
      ].filter(Boolean),
      sideEffects: true,
    },
  ]
}

/** @returns {import('webpack').Plugin[]} Plugins shared with storybook, as well as the RW app */
const getSharedPlugins = (isEnvProduction) => {
  const shouldIncludeFastRefresh =
    redwoodConfig.web.fastRefresh !== false && !isEnvProduction

  const devTimeAutoImports = isEnvProduction
    ? {}
    : {
        mockGraphQLQuery: ['@redwoodjs/testing/web', 'mockGraphQLQuery'],
        mockGraphQLMutation: ['@redwoodjs/testing/web', 'mockGraphQLMutation'],
        mockCurrentUser: ['@redwoodjs/testing/web', 'mockCurrentUser'],
      }

  return [
    isEnvProduction &&
      new MiniCssExtractPlugin({
        filename: 'static/css/[name].[contenthash:8].css',
        chunkFilename: 'static/css/[name].[contenthash:8].css',
      }),
    shouldIncludeFastRefresh &&
      // 06-2021 bug with Webpack v5 and sockjs-client dependency conflict
      // https://github.com/pmmmwh/react-refresh-webpack-plugin/issues/396
      new ReactRefreshWebpackPlugin({ overlay: false }),
    new webpack.ProvidePlugin({
      React: 'react',
      PropTypes: 'prop-types',
      gql: 'graphql-tag',
      ...devTimeAutoImports,
    }),
    // The define plugin will replace these keys with their values during build
    // time. Note that they're used in packages/web/src/config.ts, and made available in globalThis
    new webpack.DefinePlugin({
      ['RWJS_ENV']: JSON.stringify({
        RWJS_API_GRAPHQL_URL:
          redwoodConfig.web.apiGraphQLUrl ??
          `${redwoodConfig.web.apiUrl}/graphql`,
        RWJS_API_URL: redwoodConfig.web.apiUrl,
        __REDWOOD__APP_TITLE:
          redwoodConfig.web.title || path.basename(redwoodPaths.base),
      }),
      ['RWJS_DEBUG_ENV']: JSON.stringify({
        RWJS_SRC_ROOT: redwoodPaths.base,
        REDWOOD_ENV_EDITOR: process.env.REDWOOD_ENV_EDITOR,
      }),
      ...getEnvVars(),
    }),
    new Dotenv({
      path: path.resolve(redwoodPaths.base, '.env'),
      silent: true,
      // ignoreStub: true, // FIXME: this might not be necessary once the storybook webpack 4/5 stuff is ironed out. See also: https://github.com/mrsteele/dotenv-webpack#processenv-stubbing--replacing
    }),
  ].filter(Boolean)
}

// I've borrowed and learnt extensively from the `create-react-app` repo:
// https://github.com/facebook/create-react-app/blob/master/packages/react-scripts/config/webpack.config.js
module.exports = (webpackEnv) => {
  const isEnvProduction = webpackEnv === 'production'

  const shouldIncludeFastRefresh =
    redwoodConfig.web.experimentalFastRefresh && !isEnvProduction

  const webBabelOptions = getWebSideDefaultBabelConfig()

  return {
    mode: isEnvProduction ? 'production' : 'development',
    ...(isEnvProduction
      ? {
          // this is so that users can debug a production build by setting sourceMap = true in redwood.toml
          devtool: redwoodConfig.web.sourceMap ? 'source-map' : false,
        }
      : {
          devtool: 'cheap-module-source-map',
        }),
    entry: {
      /**
       * Prerender requires a top-level component.
       * Before we had `ReactDOM` and a top-level component in the same file (web/index.js).
       * If index.js is defined in the user's project, use that, if not
       * use the one provided in web/dist/entry/index.js
       */
      app:
        redwoodPaths.web.index ||
        require.resolve('@redwoodjs/web/dist/entry/index.js'),
    },
    resolve: {
      extensions: ['.wasm', '.mjs', '.js', '.jsx', '.ts', '.tsx', '.json'],
      alias: {
        // https://www.styled-components.com/docs/faqs#duplicated-module-in-node_modules
        'styled-components': path.resolve(
          redwoodPaths.base,
          'node_modules',
          'styled-components'
        ),
        '~redwood-app-root': path.resolve(redwoodPaths.web.app),
        react: path.resolve(redwoodPaths.base, 'node_modules', 'react'),
        'react-hook-form': path.resolve(
          redwoodPaths.base,
          'node_modules',
          'react-hook-form'
        ),
      },
    },
    plugins: [
      !isEnvProduction && new webpack.HotModuleReplacementPlugin(),
      new HtmlWebpackPlugin({
        template: path.resolve(redwoodPaths.base, 'web/src/index.html'),
        scriptLoading: 'defer',
        inject: true,
        chunks: 'all',
      }),
      new CopyPlugin({
        patterns: [
          {
            from: path.join(redwoodPaths.web.base, 'public'),
            to: '',
            globOptions: {
              ignore: [
                path.join(redwoodPaths.web.base, 'public/README.md'),
                path.join(redwoodPaths.web.base, 'public/mockServiceWorker.js'),
              ],
            },
          },
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
      isEnvProduction &&
        new WebpackManifestPlugin({
          fileName: 'build-manifest.json',
        }),
      isEnvProduction && new ChunkReferencesPlugin(),
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
              test: [/\.bmp$/, /\.gif$/, /\.jpe?g$/, /\.png$/, /\.svg$/],
              type: 'asset',
              parser: {
                dataUrlCondition: {
                  maxSize: 10_000,
                },
              },
              generator: {
                filename: 'static/media/[name].[contenthash:8][ext]',
              },
            },
            // (1)
            {
              test: /\.(js|mjs|jsx|ts|tsx)$/,
              exclude: /(node_modules)/,
              use: [
                {
                  loader: require.resolve('babel-loader'),
                  options: {
                    ...webBabelOptions,
                    cwd: redwoodPaths.base,
                    plugins: [
                      shouldIncludeFastRefresh &&
                        require.resolve('react-refresh/babel'),
                      ...webBabelOptions.plugins,
                    ].filter(Boolean),
                  },
                },
              ].filter(Boolean),
            },
            // (2)
            // .module.css (2), .css (3), .module.scss (4), .scss (5)
            ...getStyleLoaders(isEnvProduction),
            // (6)
            isEnvProduction && {
              test: require.resolve('@redwoodjs/router/dist/splash-page'),
              use: require.resolve('null-loader'),
            },
            // (7)
            {
              test: /\.(svg|ico|jpg|jpeg|png|gif|eot|otf|webp|ttf|woff|woff2|cur|ani|pdf)(\?.*)?$/,
              type: 'asset/resource',
              generator: {
                filename: 'static/media/[name].[contenthash:8][ext]',
              },
            },
          ].filter(Boolean),
        },
      ],
    },
    optimization: {
      mergeDuplicateChunks: true,
      splitChunks: {
        chunks: 'all',
        minChunks: 2,
      },
      runtimeChunk: {
        name: (entrypoint) => `runtime-${entrypoint.name}`,
      },
      // This doesn't get used when mode !== 'production'
      // Because minimize gets set to false, see https://webpack.js.org/configuration/mode/#usage
      minimizer: ['...', new CssMinimizerPlugin()],
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

/** @returns {import('webpack').Configuration} */
module.exports.mergeUserWebpackConfig = (mode, baseConfig) => {
  const redwoodPaths = getPaths()
  const hasCustomConfig = fs.existsSync(redwoodPaths.web.webpack)
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
