import type { TransformOptions, PluginItem } from '@babel/core'

export interface RegisterHookOptions {
  /**
   *  Be careful: plugins are a nested array e.g. [[plug1, x, x], [plug2, y, y]].
   *  These are in addition to the default RW plugins
   */
  plugins?: PluginItem[]
  overrides?: TransformOptions['overrides']
}

interface BabelRegisterOptions extends TransformOptions {
  extensions?: string[]
  cache?: boolean
}

/** NOTE:
 * We do this so we still get types, but don't import babel/register
 * Importing babel/register in typescript (instead of requiring) has dire consequences..

  Lets say we use the import syntax: import babelRequireHook from '@babel/register'
  - if your import in a JS file (like we used to in the cli project) - not a problem, and it would only invoke the register function when you called babelRequireHook
  - if you import in a TS file, the transpile process modifies it when we build the framework -
    so it will invoke it once as soon as you import, and another time when you use babelRequireHook...
    BUTTT!!! you won't notice it if your project is TS because by default it ignore .ts and .tsx files, but if its a JS project, it would try to transpile twice
 *
 *
 *
**/
export const registerBabel = (options: BabelRegisterOptions) => {
  require('@babel/register')(options)
}
