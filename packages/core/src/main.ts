import fs from 'fs'
import path from 'path'

import findUp from 'findup-sync'
import toml from 'toml'

const CONFIG_FILE_NAME = 'redwood.toml'

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
      pages: string
    }
  }
  api: {
    port: number
    paths: {
      functions: string
      graphql: string
      generated: string
    }
  }
}

export const getConfig = (): ConfigInterface => {
  const configPath = getConfigPath()
  const baseDir = getBaseDir(configPath)
  try {
    const config = toml.parse(
      fs.readFileSync(configPath, 'utf8')
    ) as ConfigInterface

    return {
      ...config,
      baseDir,
      api: {
        ...config.api,
        paths: {
          functions: path.join(baseDir, config.api.paths.functions),
          graphql: path.join(baseDir, config.api.paths.graphql),
          generated: path.join(baseDir, config.api.paths.generated),
        },
      },
      web: {
        ...config.web,
        paths: {
          pages: path.join(baseDir, 'web/src/pages'),
        },
      },
    }
  } catch (e) {
    throw new Error(`Could not parse "${configPath}": ${e}`)
  }
}
