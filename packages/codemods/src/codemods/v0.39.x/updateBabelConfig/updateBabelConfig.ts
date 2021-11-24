import fs from 'fs'
import path from 'path'

import getRWPaths from '../../../lib/getRWPaths'

export const removeBabelConfig = async () => {
  const rootBabelConfigPath = path.join(getRWPaths().base, 'babel.config.js')
  const webBabelRcPath = path.join(getRWPaths().web.base, '.babelrc.js')

  const webBabelConfigPath = path.join(getRWPaths().web.base, 'babel.config.js')

  // Remove root babel config
  if (fs.existsSync(rootBabelConfigPath)) {
    const rootConfig = require(rootBabelConfigPath)
    // If the rootConfig is the default, we can remove it
    if (
      Object.keys(rootConfig).length === 1 &&
      rootConfig.presets[0] === '@redwoodjs/core/config/babel-preset'
    ) {
      console.log('Removing root babel.config.js')
      fs.rmSync(rootBabelConfigPath)
    } else {
      // They have custom config in babel
      // Fail and ask them to move config manually
    }
  }

  if (fs.existsSync(webBabelRcPath)) {
    const webConfig = require(webBabelRcPath) //?

    // If its the default .babelrc.js
    if (
      Object.keys(webConfig).length === 1 &&
      webConfig.extends === '../babel.config.js'
    ) {
      console.log('Removing web .babelrc.js')
      fs.rmSync(webBabelRcPath)
    } else {
      // Rename .babelrc to babel.config.js
      fs.copyFileSync(webBabelRcPath, webBabelConfigPath)
    }
  }
}

export default removeBabelConfig
