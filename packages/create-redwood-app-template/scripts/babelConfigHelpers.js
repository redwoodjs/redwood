const TARGETS_NODE = '12.13.0'
const TARGETS_BROWSERS = 'defaults'
const CORE_JS_VERSION = '3.6.0'

/**
 * Preset for targetting an environment, which can be either "node" or "browsers"
 */
const presetEnvConfig = (target, ...rest) => {
  return [
    '@babel/preset-env',
    {
      targets:
        target === 'node'
          ? { node: TARGETS_NODE }
          : { browsers: TARGETS_BROWSERS },
      useBuiltIns: 'usage',
      corejs: CORE_JS_VERSION,
      ...rest,
    },
  ]
}

/**
 * Adds an alias of `src/` to the base `./src` directory of a package.
 *
 * @example
 * ```js
 * // Old way:
 * import { ComponentName } from '../../components/ComponentName'
 * // New way:
 * import { ComponentName } from 'src/components/ComponentName'
 * ```
 */
const pluginModuleResolveAliasSrcDir = () => {
  return [
    'babel-plugin-module-resolver',
    {
      alias: {
        src: './src',
      },
    },
  ]
}

module.exports = {
  presetEnvConfig: presetEnvConfig,
  pluginModuleResolveAliasSrcDir: pluginModuleResolveAliasSrcDir,
}
