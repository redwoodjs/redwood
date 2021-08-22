import fs from 'fs'
import path from 'path'

import { getPaths } from '../../paths'

import { registerBabel, RegisterHookOptions } from './common'

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

// Used in prerender only currently
export const registerWebSideBabelHook = ({
  plugins = [],
  overrides,
}: RegisterHookOptions = {}) => {
  // @NOTE
  // Even though we specify the config file, babel will still search for .babelrc
  // and merge them because we have specified the filename property, unless babelrc = false
  registerBabel({
    configFile: getWebSideBabelConfigPath(), // incase user has a custom babel.config.js in api
    babelrc: false,
    extensions: ['.js', '.ts', '.tsx', '.jsx'],
    plugins: [...plugins],
    ignore: ['node_modules'],
    cache: false,
    overrides,
  })
}
