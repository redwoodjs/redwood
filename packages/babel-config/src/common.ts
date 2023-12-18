import fs from 'fs'
import path from 'path'

import type { TransformOptions, PluginItem } from '@babel/core'
import { parseConfigFileTextToJson } from 'typescript'

import { getPaths } from '@redwoodjs/project-config'

import { getWebSideBabelPlugins } from './web'

const pkgJson = require('../package.json')

export interface RegisterHookOptions {
  /**
   *  Be careful: plugins are a nested array e.g. [[plug1, x, x], [plug2, y, y]].
   *  These are in addition to the default RW plugins
   */
  plugins?: PluginItem[]
  overrides?: TransformOptions['overrides']
}

interface BabelRegisterOptions extends TransformOptions {
  extensions?: string[]
  cache?: boolean
}

/** NOTE:
 * We do this so we still get types, but don't import babel/register
 * Importing babel/register in typescript (instead of requiring) has dire consequences..

  Lets say we use the import syntax: import babelRequireHook from '@babel/register'
  - if your import in a JS file (like we used to in the cli project) - not a problem, and it would only invoke the register function when you called babelRequireHook
  - if you import in a TS file, the transpile process modifies it when we build the framework -
    so it will invoke it once as soon as you import, and another time when you use babelRequireHook...
    BUTTT!!! you won't notice it if your project is TS because by default it ignore .ts and .tsx files, but if its a JS project, it would try to transpile twice
 *
 *
 *
**/
export const registerBabel = (options: BabelRegisterOptions) => {
  require('@babel/register')(options)
}

export const CORE_JS_VERSION = pkgJson.dependencies['core-js']
  .split('.')
  .slice(0, 2)
  .join('.') // Produces: 3.12, instead of 3.12.1

if (!CORE_JS_VERSION) {
  throw new Error(
    'RedwoodJS Project Babel: Could not determine core-js version.'
  )
}

export const RUNTIME_CORE_JS_VERSION =
  pkgJson.dependencies['@babel/runtime-corejs3']

if (!RUNTIME_CORE_JS_VERSION) {
  throw new Error(
    'RedwoodJS Project Babel: Could not determine core-js runtime version'
  )
}

export const getCommonPlugins = () => {
  return [
    ['@babel/plugin-transform-class-properties', { loose: true }],
    // Note: The private method loose mode configuration setting must be the
    // same as @babel/plugin-proposal class-properties.
    // (https://babeljs.io/docs/en/babel-plugin-proposal-private-methods#loose)
    ['@babel/plugin-transform-private-methods', { loose: true }],
    ['@babel/plugin-transform-private-property-in-object', { loose: true }],
  ]
}

// TODO (STREAMING) double check this, think about it more carefully please!
// It's related to yarn workspaces to be or not to be
export const getRouteHookBabelPlugins = () => {
  return [
    ...getWebSideBabelPlugins({
      forVite: true,
    }),
    [
      'babel-plugin-module-resolver',
      {
        alias: {
          'api/src': './src',
        },
        root: [getPaths().api.base],
        cwd: 'packagejson',
        loglevel: 'silent', // to silence the unnecessary warnings
      },
      'rwjs-api-module-resolver',
    ],
  ]
}

/**
 * Finds, reads and parses the [ts|js]config.json file
 * @returns The config object
 */
export const parseTypeScriptConfigFiles = () => {
  const rwPaths = getPaths()

  const parseConfigFile = (basePath: string) => {
    let configPath = path.join(basePath, 'tsconfig.json')
    if (!fs.existsSync(configPath)) {
      configPath = path.join(basePath, 'jsconfig.json')
      if (!fs.existsSync(configPath)) {
        return null
      }
    }
    return parseConfigFileTextToJson(
      configPath,
      fs.readFileSync(configPath, 'utf-8')
    )
  }
  const apiConfig = parseConfigFile(rwPaths.api.base)
  const webConfig = parseConfigFile(rwPaths.web.base)

  return {
    api: apiConfig?.config ?? null,
    web: webConfig?.config ?? null,
  }
}

/**
 * Extracts and formats the paths from the [ts|js]config.json file
 * @param config The config object
 * @returns {Record<string, string>} The paths object
 */
export const getPathsFromTypeScriptConfig = (config: {
  compilerOptions: { baseUrl: string; paths: string }
}): Record<string, string> => {
  if (!config) {
    return {}
  }

  if (!config.compilerOptions?.baseUrl || !config.compilerOptions?.paths) {
    return {}
  }

  const { baseUrl, paths } = config.compilerOptions
  const pathsObj: Record<string, string> = {}
  for (const [key, value] of Object.entries(paths)) {
    // exclude the default paths that are included in the tsconfig.json file
    // "src/*"
    // "$api/*"
    // "types/*"
    // "@redwoodjs/testing"
    if (key.match(/src\/|\$api\/\*|types\/\*|\@redwoodjs\/.*/g)) {
      continue
    }
    const aliasKey = key.replace('/*', '')
    const aliasValue = path.join(
      baseUrl,
      (value as string)[0].replace('/*', '')
    )
    pathsObj[aliasKey] = aliasValue
  }
  return pathsObj
}
