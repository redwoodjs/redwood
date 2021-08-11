import fs from 'fs'
import path from 'path'

import type { TransformOptions, PluginItem } from '@babel/core'
import babelRequireHook from '@babel/register'

import { getPaths } from '../../paths'

// TODO: move web side babel plugins here too when we pretranspile web side
// and export getWebSideBabelPlugins

export const getWebSideBabelConfigPath = () => {
  // @Note: web side has .babel.rc still, not babel.config.js
  // This should be handled in the prebuild for web PR
  const babelRcPath = path.join(getPaths().web.base, '.babel.rc.js')
  if (fs.existsSync(babelRcPath)) {
    return babelRcPath
  } else {
    return undefined
  }
}

interface RegisterWebHookParams {
  additionalPlugins?: PluginItem[]
  overrides?: TransformOptions['overrides']
}
// Used in prerender only currently
// Note that additionalPlugins are a nested array e.g. [[plug1, x, x], [plug2, y, y]]
export const registerWebSideBabelHook = ({
  additionalPlugins = [],
  overrides,
}: RegisterWebHookParams = {}) => {
  babelRequireHook({
    // incase user has a custom babel.config.js in api
    extends: getWebSideBabelConfigPath(),
    extensions: ['.js', '.ts', '.tsx', '.jsx'],
    plugins: [...additionalPlugins],
    ignore: ['node_modules'],
    cache: false,
    overrides,
  })
}
