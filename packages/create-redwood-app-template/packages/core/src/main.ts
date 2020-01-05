import fs from 'fs'
import path from 'path'

import findUp from 'findup-sync'
import toml from 'toml'

const HAMMER_CONFIG_FILE = 'hammer.toml'

export const getHammerConfigPath = (): string => {
  const configPath = findUp(HAMMER_CONFIG_FILE)
  if (!configPath) {
    throw new Error(
      `Could not find a "${HAMMER_CONFIG_FILE}" file, are you in a hammer project?`
    )
  }
  return configPath
}

export const getHammerBaseDir = (
  configPath: string = getHammerConfigPath()
): string => {
  return path.dirname(configPath)
}

export interface HammerConfig {
  baseDir: string
  web: {
    port: number
    apiProxyPath: string
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

export const getHammerConfig = (): HammerConfig => {
  const configPath = getHammerConfigPath()
  const baseDir = getHammerBaseDir(configPath)
  try {
    const config = toml.parse(
      fs.readFileSync(configPath, 'utf8')
    ) as HammerConfig

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
    }
  } catch (e) {
    throw new Error(`Could not parse "${configPath}": ${e}`)
  }
}
