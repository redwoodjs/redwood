import path from 'path'

import findUp from 'findup-sync'

import { Paths } from './types'

const CONFIG_FILE_NAME = 'redwood.toml'

const PATH_API_DIR_FUNCTIONS = 'api/src/functions'
const PATH_API_DIR_GRAPHQL = 'api/src/graphql'
const PATH_WEB_ROUTES = 'web/src/Routes.js'
const PATH_WEB_DIR_PAGES = 'web/src/pages/'
const PATH_WEB_DIR_COMPONENTS = 'web/src/components'

/**
 * Search the parent directories for the Redwood configuration file.
 */
export const getConfigPath = (): string => {
  const configPath = findUp(CONFIG_FILE_NAME)
  if (!configPath) {
    throw new Error(
      `Could not find a "${CONFIG_FILE_NAME}" file, are you sure you're in a Redwood project?`
    )
  }
  return configPath
}

/**
 * The Redwood config file is used as an anchor for the base directory of a project.
 */
export const getBaseDir = (configPath: string = getConfigPath()): string => {
  return path.dirname(configPath)
}

/**
 * Paths are anchored to the Redwood config file.
 */
export const getPaths = (BASE_DIR: string = getBaseDir()): Paths => {
  return {
    base: BASE_DIR,
    api: {
      functions: path.join(BASE_DIR, PATH_API_DIR_FUNCTIONS),
      graphql: path.join(BASE_DIR, PATH_API_DIR_GRAPHQL),
    },
    web: {
      routes: path.join(BASE_DIR, PATH_WEB_ROUTES),
      pages: path.join(BASE_DIR, PATH_WEB_DIR_PAGES),
      components: path.join(BASE_DIR, PATH_WEB_DIR_COMPONENTS),
    },
  }
}
