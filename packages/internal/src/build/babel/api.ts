import fs from 'fs'
import path from 'path'

import type { TransformOptions } from '@babel/core'
import * as babel from '@babel/core'

import { getPaths } from '../../paths'

import {
  registerBabel,
  RegisterHookOptions,
  BABEL_RUNTIME_VERSION,
  CORE_JS_VERSION,
} from './common'

// When we build (`yarn rw build`), we transpile with esbuild.
// But esbuild isn't in the picture for jest, console, and exec,
// so we need Babel to transpile (and therefore, need `@babel/preset-env`).
export const getApiSideBabelPresets = (
  { presetEnv } = { presetEnv: false }
) => {
  return ['@babel/preset-typescript', presetEnv && '@babel/preset-env'].filter(
    Boolean
  ) as TransformOptions['presets']
}

export const getApiSideBabelPlugins = ({ forJest } = { forJest: false }) => {
  const rwjsPaths = getPaths()

  // Plugins look like: `[ ["plugin", "options", "name"] ]`
  // We supply custom names so that user's can't accidentally overwrite our plugins when they specify theirs.
  const plugins: TransformOptions['plugins'] = [
    ['@babel/plugin-transform-typescript', undefined, 'rwjs-babel-typescript'],
    [
      '@babel/plugin-transform-runtime',
      {
        // This plugin assumes that @babel/runtime@7.0.0 is installed. Specifying the version can result in a smaller bundle size.
        // See https://babeljs.io/docs/en/babel-plugin-transform-runtime/#version.
        version: BABEL_RUNTIME_VERSION,
      },
    ],
    [
      'babel-plugin-polyfill-corejs3',
      {
        method: 'usage-pure',
        version: CORE_JS_VERSION,
        // See https://github.com/babel/babel-polyfills/issues/105.
        include: ['es.promise'],
      },
      'rwjs-babel-polyfill',
    ],

    // Needed for `jest.mock`.
    forJest && [
      'babel-plugin-module-resolver',
      {
        alias: {
          src: './src',
        },
        root: [rwjsPaths.api.base],
        cwd: 'packagejson',
        loglevel: 'silent', // to silence the unnecessary warnings
      },
      'rwjs-api-module-resolver',
    ],

    [
      require('../babelPlugins/babel-plugin-redwood-src-alias').default,
      {
        srcAbsPath: rwjsPaths.api.src,
      },
      'rwjs-babel-src-alias',
    ],
    [
      require('../babelPlugins/babel-plugin-redwood-directory-named-import')
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
            // import { context } from '@redwoodjs/graphql-server'
            members: ['context'],
            path: '@redwoodjs/graphql-server',
          },
        ],
      },
      'rwjs-babel-auto-import',
    ],
    // FIXME: `graphql-tag` isn't working: https://github.com/redwoodjs/redwood/pull/3193
    ['babel-plugin-graphql-tag', undefined, 'rwjs-babel-graphql-tag'],
    [
      require('../babelPlugins/babel-plugin-redwood-import-dir').default,
      undefined,
      'rwjs-babel-glob-import-dir',
    ],
  ].filter(Boolean) as babel.PluginItem[]

  return plugins
}

export const getApiSideBabelConfigPath = () => {
  const babelConfigPath = path.join(getPaths().api.base, 'babel.config.js')

  if (fs.existsSync(babelConfigPath)) {
    return babelConfigPath
  } else {
    return undefined
  }
}

export const NODE_TARGET = '14.20'

export const getApiSideDefaultBabelConfig = () => {
  return {
    targets: {
      node: NODE_TARGET
    },
    presets: getApiSideBabelPresets(),
    plugins: getApiSideBabelPlugins(),
    extends: getApiSideBabelConfigPath(),
    babelrc: false,
    ignore: ['node_modules'],
  }
}

// Used in CLI commands that need to transpile on the fly.
export const registerApiSideBabelHook = ({
  plugins = [],
  ...rest
}: RegisterHookOptions = {}) => {
  const defaultOptions = getApiSideDefaultBabelConfig()

  registerBabel({
    ...defaultOptions,
    presets: getApiSideBabelPresets({
      presetEnv: true,
    }),
    extensions: ['.js', '.ts', '.jsx', '.tsx'],
    plugins: [...defaultOptions.plugins, ...plugins],
    cache: false,
    ...rest,
  })
}

export const prebuildApiFile = (
  srcPath: string,
  // we need to know dstPath as well so we can generate an inline, relative sourcemap.
  dstPath: string,
  plugins: TransformOptions['plugins']
) => {
  const code = fs.readFileSync(srcPath, 'utf-8')
  const defaultOptions = getApiSideDefaultBabelConfig()

  const result = babel.transform(code, {
    ...defaultOptions,
    cwd: getPaths().api.base,
    filename: srcPath,
    // We set the sourceFile (for the sourcemap) as a correct, relative path.
    // This is why this function needs dstPath.
    sourceFileName: path.relative(path.dirname(dstPath), srcPath),
    // We need inline sourcemaps at this level because this file will eventually be fed to esbuild.
    // When esbuild finds an inline sourcemap, it tries to "combine" it.
    // So the final sourcemap (the one that esbuild generates) combines both mappings.
    sourceMaps: 'inline',
    plugins,
  })
  return result
}
