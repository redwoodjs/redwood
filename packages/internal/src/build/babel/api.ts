import fs from 'fs'
import path from 'path'

import { transform } from '@babel/core'
import type { TransformOptions } from '@babel/core'
import type { PluginItem } from '@babel/core'

import { getPaths } from '@redwoodjs/project-config'

import {
  registerBabel,
  RegisterHookOptions,
  CORE_JS_VERSION,
  RUNTIME_CORE_JS_VERSION,
  getCommonPlugins,
  parseTypeScriptConfigFiles,
  getPathsFromConfig,
} from './common'

export const TARGETS_NODE = '18.16'
// Warning! Use the minor core-js version: "corejs: '3.6'", instead of "corejs: 3",
// because we want to include the features added in the minor version.
// https://github.com/zloirock/core-js/blob/master/README.md#babelpreset-env

// Use preset env in all cases other than actual build
// e.g. jest, console and exec - because they rely on having transpiled code
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
  // https://babeljs.io/docs/en/babel-plugin-transform-runtime/#core-js-aliasing
  // Setting the version here also requires `@babel/runtime-corejs3`
  corejs: { version: 3, proposals: true },
  // https://babeljs.io/docs/en/babel-plugin-transform-runtime/#version
  // Transform-runtime assumes that @babel/runtime@7.0.0 is installed.
  // Specifying the version can result in a smaller bundle size.
  version: RUNTIME_CORE_JS_VERSION,
}

export const getApiSideBabelPlugins = (
  { openTelemetry } = {
    openTelemetry: false,
  }
) => {
  const rwjsPaths = getPaths()
  // Plugin shape: [ ["Target", "Options", "name"] ],
  // a custom "name" is supplied so that user's do not accidentally overwrite
  // Redwood's own plugins when they specify their own.

  // const corejsMajorMinorVersion = pkgJson.dependencies['core-js']
  //   .split('.')
  //   .splice(0, 2)
  //   .join('.') // Gives '3.16' instead of '3.16.12'

  // get the config object from the file
  const tsConfig = parseTypeScriptConfigFiles()

  const plugins: TransformOptions['plugins'] = [
    ...getCommonPlugins(),
    ['@babel/plugin-transform-typescript', undefined, 'rwjs-babel-typescript'],
    // [
    //   'babel-plugin-polyfill-corejs3',
    //   {
    //     method: 'usage-global',
    //     corejs: corejsMajorMinorVersion,
    //     proposals: true, // Bug: https://github.com/zloirock/core-js/issues/978#issuecomment-904839852
    //     targets: { node: TARGETS_NODE }, // Netlify defaults NodeJS 12: https://answers.netlify.com/t/aws-lambda-now-supports-node-js-14/31789/3
    //   },
    //   'rwjs-babel-polyfill',
    // ],

    /**
     *  Uses modular polyfills from @babel/runtime-corejs3 but means
     *  @babel/runtime-corejs3 MUST be included as a dependency (esp on the api side)
     *
     *  Before: import "core-js/modules/esnext.string.replace-all.js"
     *  which pollutes the global scope
     *  After: import _replaceAllInstanceProperty from "@babel/runtime-corejs3/core-js/instance/replace-all"
     *  See packages/internal/src/__tests__/build_api.test.ts for examples
     *
     *  its important that we have @babel/runtime-corejs3 as a RUNTIME dependency on rwjs/api
     *  See table on https://babeljs.io/docs/en/babel-plugin-transform-runtime#corejs
     *
     */
    ['@babel/plugin-transform-runtime', BABEL_PLUGIN_TRANSFORM_RUNTIME_OPTIONS],
    [
      'babel-plugin-module-resolver',
      {
        alias: {
          src: './src',
          // adds the paths from [ts|js]config.json to the module resolver
          ...getPathsFromConfig(tsConfig.api),
        },
        root: [rwjsPaths.api.base],
        cwd: 'packagejson',
        loglevel: 'silent', // to silence the unnecessary warnings
      },
      'rwjs-api-module-resolver',
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
    openTelemetry && [
      require('../babelPlugins/babel-plugin-redwood-otel-wrapping').default,
      undefined,
      'rwjs-babel-otel-wrapping',
    ],
  ].filter(Boolean) as PluginItem[]

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

export const prebuildApiFile = (
  srcPath: string,
  // we need to know dstPath as well
  // so we can generate an inline, relative sourcemap
  dstPath: string,
  plugins: TransformOptions['plugins']
) => {
  const code = fs.readFileSync(srcPath, 'utf-8')
  const defaultOptions = getApiSideDefaultBabelConfig()

  const result = transform(code, {
    ...defaultOptions,
    cwd: getPaths().api.base,
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

// TODO (STREAMING) I changed the prebuildApiFile function in https://github.com/redwoodjs/redwood/pull/7672/files
// but we had to revert. For this branch temporarily, I'm going to add a new function
// This is used in building routeHooks
export const transformWithBabel = (
  srcPath: string,
  plugins: TransformOptions['plugins']
) => {
  const code = fs.readFileSync(srcPath, 'utf-8')
  const defaultOptions = getApiSideDefaultBabelConfig()

  const result = transform(code, {
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
