import fs from 'fs'
import path from 'path'

import type { TransformOptions } from '@babel/core'
import * as babel from '@babel/core'

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore Not inside tsconfig rootdir
import pkgJson from '../../../package.json'
import { getPaths } from '../../paths'

import {
  registerBabel,
  RegisterHookOptions,
  CORE_JS_VERSION,
  getCommonPlugins,
} from './common'

const TARGETS_NODE = '12.16'
// Warning! Use the minor core-js version: "corejs: '3.6'", instead of "corejs: 3",
// because we want to include the features added in the minor version.
// https://github.com/zloirock/core-js/blob/master/README.md#babelpreset-env

export const getApiSideBabelPresets = (
  { presetEnv } = { presetEnv: false }
) => {
  return [
    '@babel/preset-typescript',
    // Preset-env is required for jest
    presetEnv && [
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
  ].filter(Boolean) as TransformOptions['presets']
}

export const getApiSideBabelPlugins = () => {
  const rwjsPaths = getPaths()
  // Plugin shape: [ ["Target", "Options", "name"] ],
  // a custom "name" is supplied so that user's do not accidently overwrite
  // Redwood's own plugins when they specify their own.

  const corejsMajorMinorVersion = pkgJson.dependencies['core-js']
    .split('.')
    .splice(0, 2)
    .join('.') // Gives '3.16' instead of '3.16.12'

  const plugins: TransformOptions['plugins'] = [
    ...getCommonPlugins(),
    ['@babel/plugin-transform-typescript', undefined, 'rwjs-babel-typescript'],
    [
      'babel-plugin-polyfill-corejs3',
      {
        method: 'usage-global',
        corejs: corejsMajorMinorVersion,
        proposals: true, // Bug: https://github.com/zloirock/core-js/issues/978#issuecomment-904839852
        targets: { node: 12 }, // Netlify defaults NodeJS 12: https://answers.netlify.com/t/aws-lambda-now-supports-node-js-14/31789/3
      },
      'rwjs-babel-polyfill',
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
    // FIXME: `graphql-tag` is not working: https://github.com/redwoodjs/redwood/pull/3193
    ['babel-plugin-graphql-tag', undefined, 'rwjs-babel-graphql-tag'],
    [
      require('../babelPlugins/babel-plugin-redwood-import-dir').default,
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

export const getApiSideDefaultBabelConfig = () => {
  return {
    presets: getApiSideBabelPresets(),
    plugins: getApiSideBabelPlugins(),
    config: getApiSideBabelConfigPath(),
    babelrc: false,
    ignore: [/node_modules/],
  }
}


// Used in cli commands that need to use es6, lib and services
export const registerApiSideBabelHook = ({
  plugins = [],
  ...rest
}: RegisterHookOptions = {}) => {
  registerBabel({
    presets: getApiSideBabelPresets({
      presetEnv: true,
    }),
    configFile: getApiSideBabelConfigPath(), // incase user has a custom babel.config.js in api
    babelrc: false, // Disables `.babelrc` config
    extensions: ['.js', '.ts'],
    plugins: [...getApiSideBabelPlugins(), ...plugins],
    ignore: [/node_modules/],
    cache: false,
    ...rest,
  })
}

export const prebuildFile = (
  srcPath: string,
  // we need to know dstPath as well
  // so we can generate an inline, relative sourcemap
  dstPath: string,
  plugins: TransformOptions['plugins']
) => {
  const code = fs.readFileSync(srcPath, 'utf-8')

  const result = babel.transform(code, {
    presets: getApiSideBabelPresets(),
    cwd: getPaths().api.base,
    babelrc: false, // Disables `.babelrc` config
    configFile: getApiSideBabelConfigPath(),
    filename: srcPath,
    // we set the sourceFile (for the sourcemap) as a correct, relative path
    // this is why this function (prebuildFile) must know about the dstPath
    sourceFileName: path.relative(path.dirname(dstPath), srcPath),
    // we need inline sourcemaps at this level
    // because this file will eventually be fed to esbuild
    // when esbuild finds an inline sourcemap, it tries to "combine" it
    // so the final sourcemap (the one that esbuild generates) combines both mappings
    sourceMaps: 'inline',
    plugins,
  })
  return result
}
