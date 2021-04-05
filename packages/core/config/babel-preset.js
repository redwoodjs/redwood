/**
 * This is the babel preset used in `create-redwood-app`
 */

const { getProject } = require('@redwoodjs/structure')

const packageJSON = require('../package.json')

const TARGETS_NODE = '12.16'
// Warning! Use the minor core-js version: "corejs: '3.6'", instead of "corejs: 3",
// because we want to include the features added in the minor version.
// https://github.com/zloirock/core-js/blob/master/README.md#babelpreset-env
const CORE_JS_VERSION = '3.6'

/** @type {import('@babel/core').TransformOptions} */
module.exports = () => {
  const project = getProject()
  const paths = project.host.paths

  return {
    presets: ['@babel/preset-react', '@babel/preset-typescript'],
    plugins: [
      ['@babel/plugin-proposal-class-properties', { loose: true }],
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
      ['babel-plugin-graphql-tag'],
      [
        require('../dist/babelPlugins/babel-plugin-redwood-directory-named-import'),
      ],
    ],
    overrides: [
      // ** API **
      {
        test: './api/',
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
                  process.env.NODE_ENV !== 'test' ? './src' : paths.api.src,
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
                  process.env.NODE_ENV !== 'test' ? './src' : paths.web.src,
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
          ['inline-react-svg'],
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
              project,
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
