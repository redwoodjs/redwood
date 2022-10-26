const fs = require('fs')
const path = require('path')

const { mergeWithCustomize } = require('webpack-merge')

const { getSharedPlugins } = require('@redwoodjs/core/config/webpack.common.js')
const { getConfig } = require('@redwoodjs/internal/dist/config')
const {
  getPaths,
  importStatementPath,
} = require('@redwoodjs/internal/dist/paths')

const config = getConfig()

const rwjsPaths = getPaths()

const staticAssetsFolder = path.join(getPaths().web.base, 'public')

const baseConfig = {
  core: {
    builder: 'webpack5',
  },
  stories: [
    `${importStatementPath(
      rwjsPaths.web.src
    )}/**/*.stories.@(js|jsx|ts|tsx|mdx)`,
  ],
  addons: [
    '@storybook/addon-essentials',
    config.web.a11y && '@storybook/addon-a11y',
  ].filter(Boolean),
  // Storybook's UI uses a separate Webpack configuration
  managerWebpack: (sbConfig) => {
    const userManagerPath = fs.existsSync(rwjsPaths.web.storybookManagerConfig)
      ? rwjsPaths.web.storybookManagerConfig
      : './manager.example.js'
    sbConfig.resolve.alias['~__REDWOOD__USER_STORYBOOK_MANAGER_CONFIG'] =
      userManagerPath

    return sbConfig
  },
  webpackFinal: (sbConfig, { configType }) => {
    // configType is 'PRODUCTION' or 'DEVELOPMENT', why shout?
    const isEnvProduction =
      configType && configType.toLowerCase() === 'production'

    const rwConfig = isEnvProduction
      ? require('@redwoodjs/core/config/webpack.production')
      : require('@redwoodjs/core/config/webpack.development')

    // We replace imports to "@redwoodjs/router" with our own implementation in "@redwoodjs/testing"
    sbConfig.resolve.alias['@redwoodjs/router$'] = require.resolve(
      '@redwoodjs/testing/dist/web/MockRouter.js'
    )
    // This allows us to mock `createAuthentication` which is used by auth
    // clients, which in turn lets us mock `useAuth` in tests
    sbConfig.resolve.alias['@redwoodjs/auth$'] = require.resolve(
      '@redwoodjs/testing/dist/web/mockAuth.js'
    )
    sbConfig.resolve.alias['~__REDWOOD__USER_ROUTES_FOR_MOCK'] =
      rwjsPaths.web.routes
    sbConfig.resolve.alias['~__REDWOOD__USER_WEB_SRC'] = rwjsPaths.web.src

    // Determine the default storybook style file to use.
    // If one isn't provided, set the alias to `false` to tell webpack to ignore it.
    // See https://webpack.js.org/configuration/resolve/#resolvealias.
    sbConfig.resolve.alias['~__REDWOOD__USER_WEB_DEFAULT_CSS'] = false

    const supportedStyleIndexFiles = ['index.scss', 'index.sass', 'index.css']
    for (let file of supportedStyleIndexFiles) {
      const filePath = path.join(rwjsPaths.web.src, file)
      if (fs.existsSync(filePath)) {
        sbConfig.resolve.alias['~__REDWOOD__USER_WEB_DEFAULT_CSS'] = filePath
        break
      }
    }

    const userPreviewPath = fs.existsSync(rwjsPaths.web.storybookPreviewConfig)
      ? rwjsPaths.web.storybookPreviewConfig
      : './preview.example.js'
    sbConfig.resolve.alias['~__REDWOOD__USER_STORYBOOK_PREVIEW_CONFIG'] =
      userPreviewPath

    sbConfig.resolve.extensions = rwConfig.resolve.extensions
    sbConfig.resolve.plugins = rwConfig.resolve.plugins // Directory Named Plugin

    // Webpack v5 does not include polyfills. Will error without these:
    sbConfig.resolve.fallback = {
      http: false,
      https: false,
      timers: false,
      os: false,
      tty: false,
      crypto: false,
      stream: false,
      zlib: false,
      path: false,
    }

    // ** PLUGINS **
    sbConfig.plugins = [
      ...sbConfig.plugins,
      ...getSharedPlugins(isEnvProduction),
    ]

    // ** LOADERS **
    const sbMdxRule = sbConfig.module.rules.find(
      (rule) => rule.test.toString() === /(stories|story)\.mdx$/.toString()
    )
    console.assert(sbMdxRule, 'Storybook MDX rule not found')
    sbConfig.module.rules = [...rwConfig.module.rules, sbMdxRule].filter(
      Boolean
    )

    // ** NODE **
    sbConfig.node = rwConfig.node

    // Performance Improvements:
    // https://webpack.js.org/guides/build-performance/#avoid-extra-optimization-steps
    sbConfig.optimization = {
      removeAvailableModules: false,
      removeEmptyChunks: false,
      splitChunks: false,
    }
    // https://webpack.js.org/guides/build-performance/#output-without-path-info
    sbConfig.output.pathinfo = false

    return sbConfig
  },
  // only set staticDirs when running Storybook process; will fail if set for SB --build
  ...(process.env.NODE_ENV !== 'production' && {
    staticDirs: [`${staticAssetsFolder}`],
  }),
}

const mergeUserStorybookConfig = (baseConfig) => {
  const redwoodPaths = getPaths()

  const hasCustomConfig = fs.existsSync(redwoodPaths.web.storybookConfig)
  if (!hasCustomConfig) {
    return baseConfig
  }

  const userStorybookConfig = require(redwoodPaths.web.storybookConfig)

  return mergeWithCustomize({
    // https://github.com/survivejs/webpack-merge#mergewithcustomize-customizearray-customizeobject-configuration--configuration
    customizeArray(baseConfig, userStorybookConfig, key) {
      if (key === 'addons' || key === 'stories') {
        // Allows userStorybookConfig to override baseConfig.
        // Since this is an array, we spread the user config first (so that it comes first)
        // Also, arrays don't dedupe the way objects do when spreading, so we do a conversion to and from a Set in order to remove duplicates.
        let combinedArrays = [
          ...new Set([...userStorybookConfig, ...baseConfig]),
        ]
        // To avoid `WARN Expected '@storybook/addon-actions' (or '@storybook/addon-essentials') to be listed before '@storybook/addon-interactions' in main Storybook config.`
        if (key === 'addons') {
          let key = '@storybook/addon-actions'
          combinedArrays = moveKeyToFrontOfArray(combinedArrays, key)
          key = '@storybook/addon-essentials'
          combinedArrays = moveKeyToFrontOfArray(combinedArrays, key)
        }
        return combinedArrays
      }
      // Fall back to default merging
      return undefined
    },
  })(baseConfig, userStorybookConfig)
}

/**
 *
 * @param {string[]} configs
 * @param {string} key
 * @returns modified configs with key moved to front of array if it exists in original
 */
function moveKeyToFrontOfArray(configs, key) {
  if (configs.includes(key)) {
    const filteredArrayOfConfigs = configs.filter((c) => c !== key)
    return [key, ...filteredArrayOfConfigs]
  } else {
    return configs
  }
}

/** @returns {import('webpack').Configuration} Webpack Configuration with storybook config */
module.exports = mergeUserStorybookConfig(baseConfig)
