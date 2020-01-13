import fs from 'fs'
import path from 'path'

import findUp from 'findup-sync'
import toml from 'toml'

const CONFIG_FILE_NAME = 'redwood.toml'
const PATH_API_DIR_FUNCTIONS = 'api/src/functions'
const PATH_API_DIR_GRAPHQL = 'api/src/graphql'
const PATH_WEB_ROUTES = 'web/src/Routes.js'
const PATH_WEB_DIR_PAGES = 'web/src/pages/'
const PATH_WEB_DIR_COMPONENTS = 'web/src/components'

export const getConfigPath = (): string => {
  const configPath = findUp(CONFIG_FILE_NAME)
  if (!configPath) {
    throw new Error(
      `Could not find a "${CONFIG_FILE_NAME}" file, are you sure you're in a Redwood project?`
    )
  }
  return configPath
}

export const getBaseDir = (configPath: string = getConfigPath()): string => {
  return path.dirname(configPath)
}

export interface ConfigInterface {
  baseDir: string
  web: {
    port: number
    apiProxyPath: string
    paths: {
      routes: string
      pages: string
      components: string
    }
  }
  api: {
    port: number
    paths: {
      functions: string
      graphql: string
    }
  }
}

export const getConfig = (): ConfigInterface => {
  const configPath = getConfigPath()
  const BASE_DIR = getBaseDir(configPath)
  try {
    const config = toml.parse(
      fs.readFileSync(configPath, 'utf8')
    ) as ConfigInterface

    const {
      functions = PATH_API_DIR_FUNCTIONS,
      graphql = PATH_API_DIR_GRAPHQL,
    } = config?.api?.paths || {}

    const {
      routes = PATH_WEB_ROUTES,
      pages = PATH_WEB_DIR_PAGES,
      components = PATH_WEB_DIR_COMPONENTS,
    } = config?.web?.paths || {}

    return {
      ...config,
      baseDir: BASE_DIR,
      api: {
        ...config.api,
        paths: {
          functions: path.join(BASE_DIR, functions),
          graphql: path.join(BASE_DIR, graphql),
        },
      },
      web: {
        ...config.web,
        paths: {
          routes: path.join(BASE_DIR, routes),
          pages: path.join(BASE_DIR, pages),
          components: path.join(BASE_DIR, components),
        },
      },
    }
  } catch (e) {
    throw new Error(`Could not parse "${configPath}": ${e}`)
  }
}
