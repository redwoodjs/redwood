import fs from 'fs'

import toml from 'toml'

import { Config } from './types'
import { getConfigPath, getPaths } from './paths'

/**
 * These configuration options are modified by the user via the Redwood
 * config file.
 */
export const getConfig = (): Config => {
  const configPath = getConfigPath()
  try {
    return toml.parse(fs.readFileSync(configPath, 'utf8')) as Config
  } catch (e) {
    throw new Error(`Could not parse "${configPath}": ${e}`)
  }
}


export const mergeUserWebpackConfig = (env: string, baseConfig: any) => {
  const redwoodPaths = getPaths()
  const hasCustomConfig = fs.existsSync(redwoodPaths.web.webpack)
  if (!hasCustomConfig) {
    return baseConfig
  }
  const userWebpackConfig = require(redwoodPaths.web.webpack)

  if (typeof userWebpackConfig === 'function') {
    return userWebpackConfig(baseConfig, {env})
  }

  return userWebpackConfig
}
