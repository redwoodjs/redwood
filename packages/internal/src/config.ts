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
  name?: string
  host: string
  port: number
  path: string
  target: TargetEnum.NODE
  schemaPath: string
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
  liveReload: boolean
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
  }
  experimental: {
    esbuild: boolean
  }
}

// Note that web's includeEnvironmentVariables is handled in `webpack.common.js`
// https://github.com/redwoodjs/redwood/blob/d51ade08118c17459cebcdb496197ea52485364a/packages/core/config/webpack.common.js#L19
// TODO: All parts of RedwoodJS's config should also be controlled by `RWJS_` env-vars. Document these!
// RWJS_WEB_PORT='8911'
// RWJS_ESBUILD='0'
// RWJS_WEB_OPEN='0'

const liveReload =
  typeof process.env.RWJS_WEB_LIVE_RELOAD !== 'undefined'
    ? process.env.RWJS_WEB_LIVE_RELOAD === '1'
    : true

const fastRefresh =
  typeof process.env.RWJS_WEB_FAST_REFRESH !== 'undefined'
    ? process.env.RWJS_WEB_FAST_REFRESH === '1'
    : true

const DEFAULT_CONFIG: Config = {
  web: {
    host: 'localhost',
    port: 8910,
    path: './web',
    target: TargetEnum.BROWSER,
    apiProxyPath: '/.netlify/functions',
    apiProxyPort: 8911,
    liveReload,
    fastRefresh: liveReload && fastRefresh,
    a11y: true,
  },
  api: {
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
  },
  experimental: {
    esbuild: false,
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
