import fs from 'fs'

import merge from 'deepmerge'
import toml from 'toml'

import { getConfigPath } from './paths'

export enum TargetEnum {
  NODE = 'node',
  BROWSER = 'browser',
  REACT_NATIVE = 'react-native',
  ELECTRON = 'electron',
}

export interface NodeTargetConfig {
  title: string
  name?: string
  host: string
  port: number
  path: string
  target: TargetEnum.NODE
  schemaPath: string
}

interface BrowserTargetConfig {
  title: string
  name?: string
  host: string
  port: number
  path: string
  target: TargetEnum.BROWSER
  // TODO: apiProxyHost: string
  apiProxyPort: number
  apiProxyPath: string
  fastRefresh: boolean
  a11y: boolean
}

export interface Config {
  web: BrowserTargetConfig
  api: NodeTargetConfig
  browser: {
    open: boolean | string
  }
  generate: {
    tests: boolean
    stories: boolean
    nestScaffoldByModel: boolean
  }
  experimental: {
    esbuild: boolean
    useEnvelop: boolean
  }
}

// Note that web's includeEnvironmentVariables is handled in `webpack.common.js`
// https://github.com/redwoodjs/redwood/blob/d51ade08118c17459cebcdb496197ea52485364a/packages/core/config/webpack.common.js#L19
const DEFAULT_CONFIG: Config = {
  web: {
    title: 'Redwood App',
    host: 'localhost',
    port: 8910,
    path: './web',
    target: TargetEnum.BROWSER,
    apiProxyPath: '/.netlify/functions',
    apiProxyPort: 8911,
    fastRefresh: true,
    a11y: true,
  },
  api: {
    title: 'Redwood App',
    host: 'localhost',
    port: 8911,
    path: './api',
    target: TargetEnum.NODE,
    schemaPath: './api/db/schema.prisma',
  },
  browser: {
    open: false,
  },
  generate: {
    tests: true,
    stories: true,
    nestScaffoldByModel: true,
  },
  experimental: {
    esbuild: false,
    useEnvelop: false,
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
