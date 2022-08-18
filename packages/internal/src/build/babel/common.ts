import type { TransformOptions, PluginItem } from '@babel/core'

export interface RegisterHookOptions {
  /**
   * Plugins are a nested array:
   *
   * ```
   * [
   *   ["plugin-1", { options... }, "optional alias"],
   *   ["plugin-2", { options... }, "optional alias"]
   * ]
   * ```
   *
   * And these are _in addition_ to the default redwood plugins.
   */
  plugins?: PluginItem[]
  overrides?: TransformOptions['overrides']
}

interface BabelRegisterOptions extends TransformOptions {
  extensions?: string[]
  cache?: boolean
}

/**
 * We do this so that we still get types, but don't import `@babel/register`.
 * Importing `@babel/register` in TypeScript (instead of requiring it) has dire consequences.
 *
 * Lets say we use the import syntax:
 *
 * ```
 * import babelRequireHook from '@babel/register'
 * ```
 *
 * If you import in a JS file (like we used to in the CLI project), it's not a problem.
 * It only invokes the register function when you called babelRequireHook.
 *
 * But if you import in a TS file, the transpile process modifies it when we build the framework.
 * So it will invoke it once as soon as you import, and another time when you use babelRequireHook...
 * BUTTT!!! you won't notice it if your project is TS because by default it ignores .ts and .tsx files, but if its a JS project, it would try to transpile twice
 **/
export const registerBabel = (options: BabelRegisterOptions) => {
  require('@babel/register')(options)
}

const pkgJson = require('../../../package.json')

// Produces: "3.12", instead of "3.12.1"
export const CORE_JS_VERSION = pkgJson.dependencies['core-js-pure']
  .split('.')
  .slice(0, 2)
  .join('.')

if (!CORE_JS_VERSION) {
  throw new Error(
    'RedwoodJS Project Babel: Could not determine core-js version.'
  )
}

export const BABEL_RUNTIME_VERSION = pkgJson.dependencies['@babel/runtime']

if (!BABEL_RUNTIME_VERSION) {
  throw new Error(
    'RedwoodJS Project Babel: Could not determine @babel/runtime version'
  )
}
