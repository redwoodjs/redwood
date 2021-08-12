import fs from 'fs'
import path from 'path'

import type { TransformOptions, PluginItem } from '@babel/core'

import { getPaths } from '../../paths'

import { registerBabel } from './common'

// TODO: move web side babel plugins here too when we pretranspile web side
// and export getWebSideBabelPlugins

export const getWebSideBabelConfigPath = () => {
  // @Note: web side has .babel.rc still, not babel.config.js
  // This should be handled in the prebuild for web PR
  const babelRcPath = path.join(getPaths().web.base, '.babelrc.js')
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
  // @WARN! Do NOT use import statements for babel register, within TS files
  registerBabel({
    // incase user has a custom babel.config.js in api
    extends: getWebSideBabelConfigPath(),
    extensions: ['.js', '.ts', '.tsx', '.jsx'],
    plugins: [...additionalPlugins],
    ignore: ['node_modules'],
    cache: false,
    overrides,
  })
}
