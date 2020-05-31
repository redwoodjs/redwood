import fs from 'fs'

import merge from 'deepmerge'
import toml from 'toml'
import findUp from 'findup-sync'

import { getConfigPath } from './paths'

export enum TargetEnum {
  NODE = 'node',
  BROWSER = 'browser',
  REACT_NATIVE = 'react-native',
  ELECTRON = 'electron',
}

export enum LanguageEnum {
  TYPESCRIPT = 'typescript',
  JAVASCRIPT = 'javascript',
}

export interface NodeTargetConfig {
  name?: string
  host: string
  port: number
  path: string
  target: TargetEnum.NODE
}

interface BrowserTargetConfig {
  name?: string
  host: string
  port: number
  path: string
  target: TargetEnum.BROWSER
  // TODO: apiProxyHost: string
  apiProxyPort: number
  apiProxyPath: string
}

interface LanguageTargetConfig {
  language: LanguageEnum
}

export interface Config {
  web: BrowserTargetConfig
  api: NodeTargetConfig
  browser: {
    open: boolean | string
  }
  project: LanguageTargetConfig
}

const DEFAULT_CONFIG: Config = {
  web: {
    host: 'localhost',
    port: 8910,
    path: './web',
    target: TargetEnum.BROWSER,
    apiProxyPath: '/.netlify/functions',
    apiProxyPort: 8911,
  },
  api: {
    host: 'localhost',
    port: 8911,
    path: './api',
    target: TargetEnum.NODE,
  },
  browser: {
    open: true,
  },
  project: {
    language: findUp('tsconfig.json')
      ? LanguageEnum.TYPESCRIPT
      : LanguageEnum.JAVASCRIPT,
  },
}

/**
 * These configuration options are modified by the user via the Redwood
 * config file.
 */
export const getConfig = (configPath = getConfigPath()): Config => {
  try {
    const rawConfig = fs.readFileSync(configPath, 'utf8')
    return merge(DEFAULT_CONFIG, toml.parse(rawConfig))
  } catch (e) {
    throw new Error(`Could not parse "${configPath}": ${e}`)
  }
}

/**
 * Check a project's language and redwood.toml target (if given)
 */
export const getLanguage = (): unknown => {
  return {
    default: DEFAULT_CONFIG.project.language,
    target: getConfig().project.language,
  }
}
