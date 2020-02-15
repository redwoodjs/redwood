import fs from 'fs'

import toml from 'toml'

import { Config } from './types'
import { getConfigPath } from './paths'

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
