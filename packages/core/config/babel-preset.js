/**
 * This is the babel preset used in `create-redwood-app`
 */
const { extendDefaultPlugins } = require('svgo')

const { getPaths } = require('@redwoodjs/internal')

const packageJSON = require('../package.json')

const TARGETS_NODE = '12.16'
// Warning! Use the minor core-js version: "corejs: '3.6'", instead of "corejs: 3",
// because we want to include the features added in the minor version.
// https://github.com/zloirock/core-js/blob/master/README.md#babelpreset-env
const CORE_JS_VERSION = '3.6'

/** @type {import('@babel/core').TransformOptions} */
module.exports = () => {
  const rwjsPaths = getPaths()

  return {
    presets: ['@babel/preset-react', '@babel/preset-typescript'],
    plugins: [
      ['@babel/plugin-proposal-class-properties', { loose: true }],
      // Note: The private method loose mode configuration setting must be the
      // same as @babel/plugin-proposal class-properties.
      // (https://babeljs.io/docs/en/babel-plugin-proposal-private-methods#loose)
      ['@babel/plugin-proposal-private-methods', { loose: true }],
      [
        '@babel/plugin-transform-runtime',
        {
          // https://babeljs.io/docs/en/babel-plugin-transform-runtime/#core-js-aliasing
          // Setting the version here also requires `@babel/runtime-corejs3`
          corejs: { version: 3, proposals: true },
          // https://babeljs.io/docs/en/babel-plugin-transform-runtime/#version
          // Transform-runtime assumes that @babel/runtime@7.0.0 is installed.
          // Specifying the version can result in a smaller bundle size.
          version: packageJSON.devDependencies['@babel/runtime-corejs3'],
        },
      ],

      [
        require('../dist/babelPlugins/babel-plugin-redwood-directory-named-import'),
      ],
    ],
    overrides: [
      // ** API **
      {
        test: ['./api/', './scripts/'],
        presets: [
          [
            '@babel/preset-env',
            {
              targets: {
                node: TARGETS_NODE,
              },
              useBuiltIns: 'usage',
              corejs: {
                version: CORE_JS_VERSION,
                // List of supported proposals: https://github.com/zloirock/core-js/blob/master/docs/2019-03-19-core-js-3-babel-and-a-look-into-the-future.md#ecmascript-proposals
                proposals: true,
              },
              exclude: [
                // Remove class-properties from preset-env, and include separately with loose
                // https://github.com/webpack/webpack/issues/9708
                '@babel/plugin-proposal-class-properties',
                '@babel/plugin-proposal-private-methods',
              ],
            },
          ],
        ],
        plugins: [
          [
            'babel-plugin-module-resolver',
            {
              alias: {
                src:
                  // Jest monorepo and multi project runner is not correctly determining
                  // the `cwd`: https://github.com/facebook/jest/issues/7359
                  process.env.NODE_ENV !== 'test' ? './src' : rwjsPaths.api.src,
              },
            },
          ],
          [
            'babel-plugin-auto-import',
            {
              declarations: [
                {
                  // import { context } from '@redwoodjs/api'
                  members: ['context'],
                  path: '@redwoodjs/api',
                },
                {
                  default: 'gql',
                  path: 'graphql-tag',
                },
              ],
            },
          ],
          ['babel-plugin-graphql-tag'],
          [require('../dist/babelPlugins/babel-plugin-redwood-import-dir')],
        ],
      },
      // ** WEB **
      {
        test: './web',
        presets: [
          [
            '@babel/preset-env',
            {
              // the targets are set in <userProject>/web/package.json
              useBuiltIns: 'usage',
              corejs: {
                version: CORE_JS_VERSION,
                proposals: true,
              },
              exclude: [
                // Remove class-properties from preset-env, and include separately
                // https://github.com/webpack/webpack/issues/9708
                '@babel/plugin-proposal-class-properties',
                '@babel/plugin-proposal-private-methods',
              ],
            },
          ],
        ],
        plugins: [
          [
            'babel-plugin-module-resolver',
            {
              alias: {
                src:
                  // Jest monorepo and multi project runner is not correctly determining
                  // the `cwd`: https://github.com/facebook/jest/issues/7359
                  process.env.NODE_ENV !== 'test' ? './src' : rwjsPaths.web.src,
              },
            },
          ],
          [
            'babel-plugin-auto-import',
            {
              declarations: [
                {
                  // import { React } from 'react'
                  default: 'React',
                  path: 'react',
                },
                {
                  // import PropTypes from 'prop-types'
                  default: 'PropTypes',
                  path: 'prop-types',
                },
                {
                  // import gql from 'graphql-tag'
                  default: 'gql',
                  path: 'graphql-tag',
                },
                {
                  // import { mockGraphQLQuery, mockGraphQLMutation, mockCurrentUser } from '@redwoodjs/testing'
                  members: [
                    'mockGraphQLQuery',
                    'mockGraphQLMutation',
                    'mockCurrentUser',
                  ],
                  path: '@redwoodjs/testing',
                },
              ],
            },
          ],
          ['babel-plugin-graphql-tag'],
          [
            'inline-react-svg',
            {
              svgo: {
                plugins: extendDefaultPlugins([
                  {
                    name: 'removeAttrs',
                    params: { attrs: '(data-name)' },
                  },
                  {
                    // @TODO confirm this is the right thing
                    // On my projects, this was needed for backwards compatibility
                    name: 'removeViewBox',
                    active: false,
                  },
                  {
                    // Otherwise having style="xxx" breaks
                    name: 'convertStyleToAttrs',
                  },
                ]),
              },
            },
          ],
          // @MARK needed to enable ?? operator
          // normally provided through preset-env detecting TARGET_BROWSER
          // but webpack 4 has an issue with this
          // see https://github.com/PaulLeCam/react-leaflet/issues/883
          ['@babel/plugin-proposal-nullish-coalescing-operator'],
        ],
      },
      // ** Files ending in `Cell.[js,ts]` **
      {
        test: /.+Cell.(js|tsx)$/,
        plugins: [require('../dist/babelPlugins/babel-plugin-redwood-cell')],
      },
      // Automatically import files in `./web/src/pages/*` in to
      // the `./web/src/Routes.[ts|jsx]` file.
      {
        test: ['./web/src/Routes.js', './web/src/Routes.tsx'],
        plugins: [
          [
            require('../dist/babelPlugins/babel-plugin-redwood-routes-auto-loader'),
            {
              useStaticImports: process.env.__REDWOOD__PRERENDERING === '1',
            },
          ],
        ],
      },
      // ** Files ending in `Cell.mock.[js,ts]` **
      // Automatically determine keys for saving and retrieving mock data.
      {
        test: /.+Cell.mock.(js|ts)$/,
        plugins: [
          require('../dist/babelPlugins/babel-plugin-redwood-mock-cell-data'),
        ],
      },
    ],
  }
}
