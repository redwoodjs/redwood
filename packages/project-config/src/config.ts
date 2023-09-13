import fs from 'fs'

import toml from '@iarna/toml'
import merge from 'deepmerge'
import { env as envInterpolation } from 'string-env-interpolation'

import { getConfigPath } from './configPath'

export enum TargetEnum {
  NODE = 'node',
  BROWSER = 'browser',
  REACT_NATIVE = 'react-native',
  ELECTRON = 'electron',
}

export enum BundlerEnum {
  WEBPACK = 'webpack',
  VITE = 'vite',
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
  debugPort?: number
}

interface BrowserTargetConfig {
  title: string
  name?: string
  host: string
  port: number
  path: string
  target: TargetEnum.BROWSER
  bundler: BundlerEnum
  includeEnvironmentVariables: string[]
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

  fastRefresh: boolean
  a11y: boolean
  sourceMap: boolean
}

interface GraphiQLStudioConfig {
  endpoint?: string
  authImpersonation?: AuthImpersonationConfig
}

type SupportedAuthImpersonationProviders = 'dbAuth' | 'netlify' | 'supabase'

interface AuthImpersonationConfig {
  authProvider?: SupportedAuthImpersonationProviders
  jwtSecret?: string
  userId?: string
  email?: string
  roles?: string[]
}

interface StudioConfig {
  inMemory: boolean
  graphiql?: GraphiQLStudioConfig
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
  notifications: {
    versionUpdates: string[]
  }
  experimental: {
    opentelemetry: {
      enabled: boolean
      apiSdk?: string
    }
    studio: StudioConfig
    cli: {
      autoInstall: boolean
      plugins: CLIPlugin[]
    }
    useSDLCodeGenForGraphQLTypes: boolean
    streamingSsr: {
      enabled: boolean
    }
    rsc: {
      enabled: boolean
    }
  }
}

export interface CLIPlugin {
  package: string
  version?: string
  enabled?: boolean
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
    bundler: BundlerEnum.VITE,
    includeEnvironmentVariables: [],
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
    debugPort: 18911,
  },
  browser: {
    open: false,
  },
  generate: {
    tests: true,
    stories: true,
    nestScaffoldByModel: true,
  },
  notifications: {
    versionUpdates: [],
  },
  experimental: {
    opentelemetry: {
      enabled: false,
      apiSdk: undefined,
    },
    studio: {
      inMemory: false,
      graphiql: {
        endpoint: 'graphql',
        authImpersonation: {
          authProvider: undefined,
          userId: undefined,
          email: undefined,
          roles: undefined,
          jwtSecret: 'secret',
        },
      },
    },
    cli: {
      autoInstall: true,
      plugins: [
        {
          package: '@redwoodjs/cli-storybook',
        },
        {
          package: '@redwoodjs/cli-data-migrate',
        },
      ],
    },
    useSDLCodeGenForGraphQLTypes: false,
    streamingSsr: {
      enabled: false,
    },
    rsc: {
      enabled: false,
    },
  },
}

/**
 * These configuration options are modified by the user via the Redwood
 * config file.
 */
export const getConfig = (configPath = getConfigPath()): Config => {
  try {
    return merge(DEFAULT_CONFIG, getRawConfig(configPath))
  } catch (e) {
    throw new Error(`Could not parse "${configPath}": ${e}`)
  }
}

/**
 * Returns the JSON parse of the config file without any default values.
 *
 * @param configPath Path to the config file, defaults to automatically find the project `redwood.toml` file
 * @returns A JSON object from the parsed toml values
 */
export function getRawConfig(configPath = getConfigPath()) {
  try {
    return toml.parse(envInterpolation(fs.readFileSync(configPath, 'utf8')))
  } catch (e) {
    throw new Error(`Could not parse "${configPath}": ${e}`)
  }
}
