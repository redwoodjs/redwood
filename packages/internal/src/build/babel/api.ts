import fs from 'fs'
import path from 'path'

import type { TransformOptions, PluginItem } from '@babel/core'
import babelRequireHook from '@babel/register'

import { getPaths } from '../../paths'

export const getApiSideBabelPlugins = () => {
  const rwjsPaths = getPaths()
  // Plugin shape: [ ["Target", "Options", "name"] ],
  // a custom "name" is supplied so that user's do not accidently overwrite
  // Redwood's own plugins.
  const plugins: TransformOptions['plugins'] = [
    ['@babel/plugin-transform-typescript', undefined, 'rwjs-babel-typescript'],
    [
      require('@redwoodjs/core/dist/babelPlugins/babel-plugin-redwood-src-alias')
        .default,
      {
        srcAbsPath: rwjsPaths.api.src,
      },
      'rwjs-babel-src-alias',
    ],
    [
      require('@redwoodjs/core/dist/babelPlugins/babel-plugin-redwood-directory-named-import')
        .default,
      undefined,
      'rwjs-babel-directory-named-modules',
    ],
    [
      'babel-plugin-auto-import',
      {
        declarations: [
          {
            // import gql from 'graphql-tag'
            default: 'gql',
            path: 'graphql-tag',
          },
          {
            // import { context } from '@redwoodjs/api'
            members: ['context'],
            path: '@redwoodjs/api',
          },
        ],
      },
      'rwjs-babel-auto-import',
    ],
    // FIXME: Babel plugin GraphQL tag doesn't seem to be working.
    ['babel-plugin-graphql-tag', undefined, 'rwjs-babel-graphql-tag'],
    [
      require('@redwoodjs/core/dist/babelPlugins/babel-plugin-redwood-import-dir')
        .default,
      undefined,
      'rwjs-babel-glob-import-dir',
    ],
  ].filter(Boolean)

  return plugins
}

export const getApiSideBabelConfigPath = () => {
  const p = path.join(getPaths().api.base, 'babel.config.js')
  if (fs.existsSync(p)) {
    return p
  } else {
    return undefined
  }
}

interface RegisterApiHookParams {
  additionalPlugins?: PluginItem[]
}

// Used in cli commands that need to use es6, lib and services
// Note that additionalPlugins are a nested array e.g. [[plug1, x, x], [plug2, y, y]]
export const registerApiSideBabelHook = ({
  additionalPlugins = [],
}: RegisterApiHookParams = {}) => {
  babelRequireHook({
    // incase user has a custom babel.config.js in api
    extends: getApiSideBabelConfigPath(),
    extensions: ['.js', '.ts'],
    plugins: [...getApiSideBabelPlugins(), ...additionalPlugins],
    ignore: ['node_modules'],
    cache: false,
  })
}
