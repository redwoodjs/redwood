import { existsSync } from 'fs'
import fs from 'fs/promises'
import path from 'path'

import type { PluginItem, TransformOptions } from '@babel/core'
import { transformAsync } from '@babel/core'

import { getPaths } from '@redwoodjs/project-config'

import type { RegisterHookOptions } from './common'
import {
  CORE_JS_VERSION,
  RUNTIME_CORE_JS_VERSION,
  getCommonPlugins,
  getPathsFromTypeScriptConfig,
  parseTypeScriptConfigFiles,
  registerBabel,
} from './common'

export const TARGETS_NODE = '20.10'

export const getApiSideBabelPresets = (
  { presetEnv } = { presetEnv: false }
) => {
  return [
    [
      '@babel/preset-typescript',
      {
        isTSX: true,
        allExtensions: true,
      },
      'rwjs-babel-preset-typescript',
    ],
    // Preset-env is required when we are not doing the transpilation with esbuild
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
          '@babel/plugin-transform-class-properties',
          '@babel/plugin-transform-private-methods',
        ],
      },
    ],
  ].filter(Boolean) as TransformOptions['presets']
}

export const BABEL_PLUGIN_TRANSFORM_RUNTIME_OPTIONS = {
  // See https://babeljs.io/docs/babel-plugin-transform-runtime/#corejs
  // and https://babeljs.io/docs/en/babel-plugin-transform-runtime/#core-js-aliasing.
  //
  // This results in over polyfilling.
  corejs: { version: 3, proposals: true },

  // See https://babeljs.io/docs/en/babel-plugin-transform-runtime/#version.
  version: RUNTIME_CORE_JS_VERSION,
}

export const getApiSideBabelPlugins = (
  { openTelemetry } = {
    openTelemetry: false,
  }
) => {
  // Plugin shape: [ ["Target", "Options", "name"] ],
  // a custom "name" is supplied so that user's do not accidentally overwrite
  // Redwood's own plugins when they specify their own.
  const tsConfig = parseTypeScriptConfigFiles()

  const plugins: TransformOptions['plugins'] = [
    ...getCommonPlugins(),
    // Needed to support `/** @jsxImportSource custom-jsx-library */`
    // comments in JSX files
    ['@babel/plugin-transform-react-jsx', { runtime: 'automatic' }],
    ['@babel/plugin-transform-runtime', BABEL_PLUGIN_TRANSFORM_RUNTIME_OPTIONS],
    [
      'babel-plugin-module-resolver',
      {
        alias: {
          src: './src',
          // adds the paths from [ts|js]config.json to the module resolver
          ...getPathsFromTypeScriptConfig(tsConfig.api, getPaths().api.base),
        },
        root: [getPaths().api.base],
        cwd: 'packagejson',
        loglevel: 'silent', // to silence the unnecessary warnings
      },
      'rwjs-api-module-resolver',
    ],
    [
      require('./plugins/babel-plugin-redwood-directory-named-import').default,
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
            // import { context } from '@redwoodjs/context'
            members: ['context'],
            path: '@redwoodjs/context',
          },
        ],
      },
      'rwjs-babel-auto-import',
    ],
    // FIXME: `graphql-tag` is not working: https://github.com/redwoodjs/redwood/pull/3193
    ['babel-plugin-graphql-tag', undefined, 'rwjs-babel-graphql-tag'],
    [
      require('./plugins/babel-plugin-redwood-import-dir').default,
      undefined,
      'rwjs-babel-glob-import-dir',
    ],
    openTelemetry && [
      require('./plugins/babel-plugin-redwood-otel-wrapping').default,
      undefined,
      'rwjs-babel-otel-wrapping',
    ],
  ].filter(Boolean) as PluginItem[]

  return plugins
}

export const getApiSideBabelConfigPath = () => {
  const p = path.join(getPaths().api.base, 'babel.config.js')
  if (existsSync(p)) {
    return p
  } else {
    // Null and undefined do not have the same effect I believe
    return undefined
  }
}

export const getApiSideBabelOverrides = () => {
  const overrides = [
    // Apply context wrapping to all functions
    {
      // match */api/src/functions/*.js|ts
      test: /.+api(?:[\\|/])src(?:[\\|/])functions(?:[\\|/]).+.(?:js|ts)$/,
      plugins: [
        require('./plugins/babel-plugin-redwood-context-wrapping').default,
      ],
    },
  ].filter(Boolean)
  return overrides as TransformOptions[]
}

export const getApiSideDefaultBabelConfig = () => {
  return {
    presets: getApiSideBabelPresets(),
    plugins: getApiSideBabelPlugins(),
    overrides: getApiSideBabelOverrides(),
    extends: getApiSideBabelConfigPath(),
    babelrc: false,
    ignore: ['node_modules'],
  }
}

// Used in cli commands that need to use es6, lib and services
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

export const transformWithBabel = async (
  srcPath: string,
  plugins: TransformOptions['plugins']
) => {
  const code = await fs.readFile(srcPath, 'utf-8')
  const defaultOptions = getApiSideDefaultBabelConfig()

  const result = transformAsync(code, {
    ...defaultOptions,
    cwd: getPaths().api.base,
    filename: srcPath,
    // we need inline sourcemaps at this level
    // because this file will eventually be fed to esbuild
    // when esbuild finds an inline sourcemap, it tries to "combine" it
    // so the final sourcemap (the one that esbuild generates) combines both mappings
    sourceMaps: 'inline',
    plugins,
  })

  return result
}
