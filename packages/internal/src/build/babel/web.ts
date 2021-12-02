import fs from 'fs'
import path from 'path'

import * as babel from '@babel/core'
import type { TransformOptions } from '@babel/core'

import { getPaths } from '../../paths'

import {
  CORE_JS_VERSION,
  getCommonPlugins,
  registerBabel,
  RegisterHookOptions,
} from './common'

export const getWebSideBabelPlugins = () => {
  const rwjsPaths = getPaths()

  const plugins: TransformOptions['plugins'] = [
    ...getCommonPlugins(),

    // === Import path handling
    [
      require('../babelPlugins/babel-plugin-redwood-src-alias').default,
      {
        srcAbsPath: rwjsPaths.web.src,
      },
      'rwjs-babel-src-alias',
    ],
    [
      require('../babelPlugins/babel-plugin-redwood-directory-named-import')
        .default,
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
    [
      'inline-react-svg',
      {
        svgo: {
          plugins: [
            {
              name: 'removeAttrs',
              params: { attrs: '(data-name)' },
            },
            // Otherwise having style="xxx" breaks
            'convertStyleToAttrs',
          ],
        },
      },
      'rwjs-inline-svg',
    ],

    // === Handling redwood "magic"
  ].filter(Boolean)

  return plugins
}

export const getWebSideOverrides = (
  { staticImports } = {
    staticImports: false,
  }
) => {
  const overrides = [
    {
      test: /.+Cell.(js|tsx)$/,
      plugins: [require('../babelPlugins/babel-plugin-redwood-cell').default],
    },
    // Automatically import files in `./web/src/pages/*` in to
    // the `./web/src/Routes.[ts|jsx]` file.
    {
      test: /web\/src\/Routes.(js|tsx)$/,
      plugins: [
        [
          require('../babelPlugins/babel-plugin-redwood-routes-auto-loader')
            .default,
          {
            useStaticImports: staticImports,
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
        require('../babelPlugins/babel-plugin-redwood-mock-cell-data').default,
      ],
    },
  ].filter(Boolean)

  return overrides as TransformOptions[]
}

export const getWebSideBabelPresets = () => {
  let reactPresetConfig = undefined

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
    ['@babel/preset-typescript', undefined, 'rwjs-babel-preset-typescript'],
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
      'rwjs-babel-preset-env',
    ],
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

export const getWebSideDefaultBabelConfig = () => {
  // NOTE:
  // Even though we specify the config file, babel will still search for .babelrc
  // and merge them because we have specified the filename property, unless babelrc = false

  return {
    presets: getWebSideBabelPresets(),
    plugins: getWebSideBabelPlugins(),
    overrides: getWebSideOverrides(),
    extends: getWebSideBabelConfigPath(),
    babelrc: false,
    ignore: ['node_modules'],
  }
}

// Used in prerender only currently
export const registerWebSideBabelHook = ({
  plugins = [],
  overrides = [],
}: RegisterHookOptions = {}) => {
  const defaultOptions = getWebSideDefaultBabelConfig()
  registerBabel({
    ...defaultOptions,
    root: getPaths().base,
    extensions: ['.js', '.ts', '.tsx', '.jsx'],
    plugins: [...defaultOptions.plugins, ...plugins],
    cache: false,
    // We only register for prerender currently
    // Static importing pages makes sense
    overrides: [...getWebSideOverrides({ staticImports: true }), ...overrides],
  })
}

// @MARK
// Currently only used in testing
export const prebuildFile = (
  srcPath: string,
  // we need to know dstPath as well
  // so we can generate an inline, relative sourcemap
  dstPath: string,
  plugins: TransformOptions['plugins']
) => {
  const code = fs.readFileSync(srcPath, 'utf-8')
  const defaultOptions = getWebSideDefaultBabelConfig()

  const result = babel.transform(code, {
    ...defaultOptions,
    cwd: getPaths().web.base,
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
