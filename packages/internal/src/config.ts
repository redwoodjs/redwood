import fs from 'fs'

import merge from 'deepmerge'
import { env as envInterpolation } from 'string-env-interpolation'
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
  serverConfig: string
}

interface BrowserTargetConfig {
  title: string
  name?: string
  host: string
  port: number
  path: string
  target: TargetEnum.BROWSER
  /**
   * Specify the URL to your api-server.
   * This can be an absolute path proxied on the current domain (`/.netlify/functions`),
   * or a fully qualified URL (`https://api.example.org:8911/functions`).
   *
   * Note: This should not include the path to the GraphQL Server.
   **/
  apiUrl: string
  /**
   * Optional: FQDN or absolute path to the GraphQL serverless function, without the trailing slash.
   * This will override the apiUrl configuration just for the graphql function
   * Example: `./redwood/functions/graphql` or `https://api.redwoodjs.com/graphql`
   */
  apiGraphQLUrl?: string
  /**
   * Optional: FQDN or absolute path to the DbAuth serverless function, without the trailing slash.
   * This will override the apiUrl configuration just for the dbAuth function
   * Example: `./redwood/functions/auth` or `https://api.redwoodjs.com/auth`
   **/
  apiDbAuthUrl?: string

  fastRefresh: boolean
  a11y: boolean
  sourceMap: boolean
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
    apiUrl: '/.redwood/functions',
    fastRefresh: true,
    a11y: true,
    sourceMap: false,
  },
  api: {
    title: 'Redwood App',
    host: 'localhost',
    port: 8911,
    path: './api',
    target: TargetEnum.NODE,
    schemaPath: './api/db/schema.prisma',
    serverConfig: './api/server.config.js',
  },
  browser: {
    open: false,
  },
  generate: {
    tests: true,
    stories: true,
    nestScaffoldByModel: true,
  },
}

/**
 * These configuration options are modified by the user via the Redwood
 * config file.
 */
export const getConfig = (configPath = getConfigPath()): Config => {
  try {
    const rawConfig = envInterpolation(fs.readFileSync(configPath, 'utf8'))
    return merge(DEFAULT_CONFIG, toml.parse(rawConfig))
  } catch (e) {
    throw new Error(`Could not parse "${configPath}": ${e}`)
  }
}
