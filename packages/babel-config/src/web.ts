import fs from 'fs'
import path from 'path'

import * as babel from '@babel/core'
import type { TransformOptions } from '@babel/core'

import { getPaths } from '@redwoodjs/project-config'

import {
  CORE_JS_VERSION,
  getCommonPlugins,
  registerBabel,
  RegisterHookOptions,
  parseTypeScriptConfigFiles,
  getPathsFromTypeScriptConfig,
} from './common'

export const getWebSideBabelPlugins = (
  { forJest, forVite }: Flags = { forJest: false, forVite: false }
) => {
  const rwjsPaths = getPaths()
  // Get the TS configs in the api and web sides as an object
  const tsConfigs = parseTypeScriptConfigFiles()

  // Vite does not need these plugins
  const commonPlugins = forVite ? [] : getCommonPlugins()
  const plugins = [
    ...commonPlugins,
    // === Import path handling
    [
      'babel-plugin-module-resolver',
      {
        alias: {
          src:
            // Jest monorepo and multi project runner is not correctly determining
            // the `cwd`: https://github.com/facebook/jest/issues/7359
            forJest ? rwjsPaths.web.src : './src',
          // adds the paths from [ts|js]config.json to the module resolver
          ...getPathsFromTypeScriptConfig(tsConfigs.web),
          $api: rwjsPaths.api.base,
        },
        root: [rwjsPaths.web.base],
        cwd: 'packagejson',
        loglevel: 'silent', // to silence the unnecessary warnings
      },
      'rwjs-module-resolver',
    ],
    [
      require('./plugins/babel-plugin-redwood-directory-named-import').default,
      undefined,
      'rwjs-directory-named-modules',
    ],

    // === Auto imports, and transforms
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
        ],
      },
      'rwjs-web-auto-import',
    ],
    ['babel-plugin-graphql-tag', undefined, 'rwjs-babel-graphql-tag'],
    process.env.NODE_ENV !== 'development' && [
      require('./plugins/babel-plugin-redwood-remove-dev-fatal-error-page')
        .default,
      undefined,
      'rwjs-remove-dev-fatal-error-page',
    ],
  ].filter(Boolean) as TransformOptions[]

  return plugins
}

export const getWebSideOverrides = (
  { prerender, forVite }: Flags = {
    prerender: false,
    forVite: false,
  }
) => {
  const overrides = [
    {
      test: /.+Cell.(js|tsx|jsx)$/,
      plugins: [require('./plugins/babel-plugin-redwood-cell').default],
    },
    // Automatically import files in `./web/src/pages/*` in to
    // the `./web/src/Routes.[ts|jsx]` file.
    {
      test: /Routes.(js|tsx|jsx)$/,
      plugins: [
        [
          require('./plugins/babel-plugin-redwood-routes-auto-loader').default,
          {
            prerender,
            vite: forVite,
          },
        ],
      ],
    },
    // ** Files ending in `Cell.mock.[js,ts]` **
    // Automatically determine keys for saving and retrieving mock data.
    // Only required for storybook and jest
    process.env.NODE_ENV !== 'production' && {
      test: /.+Cell.mock.(js|ts)$/,
      plugins: [
        require('./plugins/babel-plugin-redwood-mock-cell-data').default,
      ],
    },
  ].filter(Boolean)

  return overrides as TransformOptions[]
}

export const getWebSideBabelPresets = (options: Flags) => {
  if (options.forVite) {
    return []
  }

  let reactPresetConfig: babel.PluginItem = { runtime: 'automatic' }

  // This is a special case, where @babel/preset-react needs config
  // And using extends doesn't work
  if (getWebSideBabelConfigPath()) {
    const userProjectConfig = require(getWebSideBabelConfigPath() as string)

    userProjectConfig.presets?.forEach(
      (preset: TransformOptions['presets']) => {
        // If it isn't a preset with special config ignore it
        if (!Array.isArray(preset)) {
          return
        }

        const [presetName, presetConfig] = preset
        if (presetName === '@babel/preset-react') {
          reactPresetConfig = presetConfig
        }
      }
    )
  }
  return [
    ['@babel/preset-react', reactPresetConfig],
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
          '@babel/plugin-transform-class-properties',
          '@babel/plugin-transform-private-methods',
        ],
      },
      'rwjs-babel-preset-env',
    ],
    ['@babel/preset-typescript', undefined, 'rwjs-babel-preset-typescript'],
  ]
}

export const getWebSideBabelConfigPath = () => {
  const customBabelConfig = path.join(getPaths().web.base, 'babel.config.js')
  if (fs.existsSync(customBabelConfig)) {
    return customBabelConfig
  } else {
    return undefined
  }
}

// These flags toggle on/off certain features
export interface Flags {
  forJest?: boolean // will change the alias for module-resolver plugin
  prerender?: boolean // changes what babel-plugin-redwood-routes-auto-loader does
  forVite?: boolean
}

export const getWebSideDefaultBabelConfig = (options: Flags = {}) => {
  // NOTE:
  // Even though we specify the config file, babel will still search for .babelrc
  // and merge them because we have specified the filename property, unless babelrc = false

  return {
    presets: getWebSideBabelPresets(options),
    plugins: getWebSideBabelPlugins(options),
    overrides: getWebSideOverrides(options),
    extends: getWebSideBabelConfigPath(),
    babelrc: false,
    ignore: ['node_modules'],
  }
}

// Used in prerender only currently
export const registerWebSideBabelHook = ({
  forVite = false,
  plugins = [],
  overrides = [],
}: RegisterHookOptions & { forVite?: boolean } = {}) => {
  const defaultOptions = getWebSideDefaultBabelConfig()
  registerBabel({
    ...defaultOptions,
    root: getPaths().base,
    extensions: ['.js', '.ts', '.tsx', '.jsx'],
    plugins: [...defaultOptions.plugins, ...plugins],
    cache: false,
    // We only register for prerender currently
    // Static importing pages makes sense
    overrides: [
      ...getWebSideOverrides({ prerender: true, forVite }),
      ...overrides,
    ],
  })
}

// @MARK
// Currently only used in testing
export const prebuildWebFile = (srcPath: string, flags: Flags = {}) => {
  const code = fs.readFileSync(srcPath, 'utf-8')
  const defaultOptions = getWebSideDefaultBabelConfig(flags)

  const result = babel.transform(code, {
    ...defaultOptions,
    cwd: getPaths().web.base,
    filename: srcPath,
  })
  return result
}
