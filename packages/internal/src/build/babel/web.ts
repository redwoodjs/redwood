import fs from 'fs'
import path from 'path'

import type { TransformOptions } from '@babel/core'

import { getPaths } from '../../paths'

import {
  CORE_JS_VERSION,
  getCommonPlugins,
  registerBabel,
  RegisterHookOptions,
} from './common'

// @TODO make sure you remove dependencies that are no longer required
// @TODO make sure you remove dependencies that are no longer required
// @TODO make sure you remove dependencies that are no longer required
// @TODO make sure you remove dependencies that are no longer required
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
  return [
    {
      test: /.+Cell.(js|tsx)$/,
      plugins: [require('../babelPlugins/babel-plugin-redwood-cell').default],
    },
    // Automatically import files in `./web/src/pages/*` in to
    // the `./web/src/Routes.[ts|jsx]` file.
    {
      test: ['./web/src/Routes.js', './web/src/Routes.tsx'],
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
    // @TODO only enable this for storybook, 😨
    {
      test: /.+Cell.mock.(js|ts)$/,
      plugins: [
        require('../babelPlugins/babel-plugin-redwood-mock-cell-data').default,
      ],
    },
  ]
}

export const getWebSideBabelPresets = () => {
  return [
    '@babel/preset-react',
    '@babel/preset-typescript',
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
  return {
    presets: getWebSideBabelPresets(),
    plugins: getWebSideBabelPlugins(),
    overrides: getWebSideOverrides(),
    config: getWebSideBabelConfigPath(),
    babelrc: false,
    ignore: [/node_modules/],
  }
}

// Used in prerender only currently
export const registerWebSideBabelHook = ({
  plugins = [],
  overrides = [],
}: RegisterHookOptions = {}) => {
  // NOTE:
  // Even though we specify the config file, babel will still search for .babelrc
  // and merge them because we have specified the filename property, unless babelrc = false
  registerBabel({
    root: getPaths().base,
    presets: getWebSideBabelPresets(),
    configFile: getWebSideBabelConfigPath(), // incase user has a custom babel.config.js in web
    babelrc: false,
    extensions: ['.js', '.ts', '.tsx', '.jsx'],
    plugins: [...getWebSideBabelPlugins(), ...plugins],
    ignore: [/node_modules/],
    cache: false,
    // @DONOTMERGE Find a better way of passing this
    // @DONOTMERGE Find a better way of passing this
    // @DONOTMERGE Find a better way of passing this
    // @DONOTMERGE Find a better way of passing this
    overrides: [...getWebSideOverrides({ staticImports: true }), ...overrides],
  })
}
