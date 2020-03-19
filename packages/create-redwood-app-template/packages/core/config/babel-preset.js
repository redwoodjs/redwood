/**
 * This is the babel preset used `create-redwood-app`
 */

// TODO: Determine what to do different during development, test, and production
// TODO: Take a look at create-react-app. They've dropped a ton of knowledge.

const fs = require('fs')
const path = require('path')

const { getPaths } = require('@redwoodjs/internal')

const TARGETS_NODE = '12.16.1'
// https://github.com/zloirock/core-js/blob/master/README.md#babelpreset-env
// Warning! Recommended to specify used minor core-js version, like corejs: '3.6',
// instead of corejs: 3, since with corejs: 3 will not be injected modules which
// were added in minor core-js releases.
const CORE_JS_VERSION = '3.6'
const DB_INITIALIZER_PATH = path.join(getPaths().api.init, 'dbInstance')

// Whether a given file path is a Javascript or Typescript file
const isScript = (filePath) => {
  return !!path.extname(filePath).match(/^[jt]s$/)
}
// Filters a list of files to only return Javascript or Typescripts
const scriptsOnly = (files) => {
  return files.filter(isScript)
}
// Given a path like 'src/config/dbInstance' will return the path to the actual
// filename like 'src/config/dbInstance.ts' (or .js) or will return null
const pathIfScriptExists = (path) => {
  return scriptsOnly(fs.readdirSync(path)).length !== 0 ? path : null
}

module.exports = () => ({
  presets: ['@babel/preset-react', '@babel/typescript'],
  plugins: [
    ['@babel/plugin-proposal-class-properties', { loose: true }],
    'babel-plugin-macros',
    [
      '@babel/plugin-transform-runtime',
      {
        // https://babeljs.io/docs/en/babel-plugin-transform-runtime/#core-js-aliasing
        // Setting the version here also requires `@babel/runtime-corejs3`
        corejs: { version: 3, proposals: true },
        // https://babeljs.io/docs/en/babel-plugin-transform-runtime/#version
        // Transform-runtime assumes that @babel/runtime@7.0.0 is installed.
        // Specifying the version can result in a smaller bundle size.
        // TODO: Grab version for package.json
        version: '^7.8.3',
      },
    ],
    ['babel-plugin-graphql-tag'],
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
              src: getPaths().api.src,
            },
          },
        ],
        [
          'babel-plugin-auto-import',
          {
            declarations: [
              {
                // import { db } from '@redwoodjs/api/dist/dbInstance'
                members: ['db'],
                path:
                  pathIfScriptExists(DB_INITIALIZER_PATH) ||
                  '@redwoodjs/api/dist/dbInstance',
              },
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
      ],
    },
    // ** WEB **
    {
      test: './web',
      presets: [
        [
          '@babel/preset-env',
          {
            // the targets are set in web/package.json
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
              src: './src',
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
                // import { PropTypes } from 'prop-types'
                default: 'PropTypes',
                path: 'prop-types',
              },
              {
                // import gql from 'graphql-tag'
                default: 'gql',
                path: 'graphql-tag',
              },
            ],
          },
        ],
      ],
    },
  ],
})
