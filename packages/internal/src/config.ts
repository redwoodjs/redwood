import fs from 'fs'

import toml from 'toml'
import merge from 'deepmerge'
import findUp from 'findup-sync'

const CONFIG_FILE_NAME = 'redwood.toml'

/**
 * Search the parent directories for the `redwood.toml` configuration file.
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

export enum TargetEnum {
  NODE = 'node',
  BROWSER = 'browser',
  REACT_NATIVE = 'react-native',
  ELECTRON = 'electron',
}

interface BuildConfig {
  name: string
  command: string
  source?: string
  destination?: string
}

interface NodeProjectConfig {
  host: string
  port: number
  path: string
  target: TargetEnum.NODE
  build: [BuildConfig]
}

interface BrowserProjectConfig {
  host: string
  port: number
  path: string
  target: TargetEnum.BROWSER
  apiProxyPath: string
  apiProxyPort: number
  build: Array<BuildConfig>
}

export type Config = {
  [workspace: string]: BrowserProjectConfig | NodeProjectConfig
} & {
  browser?: { open: boolean | string }
}

export const DEFAULT_CONFIG: Config = {
  web: {
    host: 'localhost',
    port: 8910,
    path: './web',
    target: TargetEnum.BROWSER,
    apiProxyPath: './netlify/functions',
    apiProxyPort: 8911,
    build: [
      {
        name: 'default',
        command:
          'yarn webpack --config ../node_modules/@redwoodjs/core/config/webpack.production.js',
        source: './src',
        destination: './dist',
      },
      {
        name: 'stats',
        command:
          'yarn webpack --config ../node_modules/@redwoodjs/core/config/webpack.stats.js',
        source: './src',
        destination: './dist',
      },
    ],
  },
  api: {
    host: 'localhost',
    port: 8911,
    path: './api',
    target: TargetEnum.NODE,
    build: [
      {
        name: 'default',
        command: 'NODE_ENV=production babel src --out-dir dist',
        source: './src',
        destination: './dist',
      },
    ],
  },
}

/**
 * These configuration options are modified by the user in `redwood.toml`.
 * The modifications are merged with our default configuration where we provide
 * two workspaces: `api` and `web`.
 */
export const getConfig = (): Config => {
  const configPath = getConfigPath()
  try {
    const rawConfig = fs.readFileSync(configPath, 'utf8')
    return merge(DEFAULT_CONFIG, toml.parse(rawConfig))
  } catch (e) {
    throw new Error(`Could not parse "${configPath}": ${e}`)
  }
}
