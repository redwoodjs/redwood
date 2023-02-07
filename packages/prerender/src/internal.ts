import fs from 'fs'
import path from 'path'

import { fetch } from '@whatwg-node/fetch'

import { getConfig } from '@redwoodjs/internal/dist/config'
import { getPaths } from '@redwoodjs/internal/dist/paths'

const INDEX_FILE = path.join(getPaths().web.dist, 'index.html')
const DEFAULT_INDEX = path.join(getPaths().web.dist, '200.html')

export const getRootHtmlPath = () => {
  if (fs.existsSync(DEFAULT_INDEX)) {
    return DEFAULT_INDEX
  } else {
    return INDEX_FILE
  }
}

export const registerShims = (routerPath: string) => {
  const rwjsConfig = getConfig()

  globalThis.RWJS_ENV = {
    RWJS_API_GRAPHQL_URL:
      rwjsConfig.web.apiGraphQLUrl ?? rwjsConfig.web.apiUrl + '/graphql',
    RWJS_API_URL: rwjsConfig.web.apiUrl,
    __REDWOOD__APP_TITLE: rwjsConfig.web.title,
  }

  globalThis.RWJS_DEBUG_ENV = {
    RWJS_SRC_ROOT: getPaths().web.src,
  }

  // For now set bundler to webpack for prerendering
  globalThis.RWJS_WEB_BUNDLER = 'webpack'

  globalThis.__REDWOOD__PRERENDERING = true

  globalThis.__REDWOOD__HELMET_CONTEXT = {}

  // Let routes auto loader plugin know
  process.env.__REDWOOD__PRERENDERING = '1'

  // This makes code like globalThis.location.pathname work also outside of the
  // router
  globalThis.location = {
    ...globalThis.location,
    pathname: routerPath,
  }
  // Shim fetch in the node.js context
  // This is to avoid using cross-fetch when configuring apollo-client
  // which would cause the client bundle size to increase
  if (!globalThis.fetch) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore-next-line
    globalThis.fetch = fetch
  }
}

export const writeToDist = (outputHtmlPath: string, renderOutput: string) => {
  const dirName = path.dirname(outputHtmlPath)
  const exist = fs.existsSync(dirName)
  if (!exist) {
    fs.mkdirSync(dirName, { recursive: true })
  }

  fs.writeFileSync(outputHtmlPath, renderOutput)
}

/**
 * Read and parse the tsconfig.json file
 * @param configPath The path to the tsconfig.json file
 * @returns The tsconfig object
 */
const readTsconfig = (configPath?: string) => {
  const filePath = path.join(configPath ?? process.cwd(), 'tsconfig.json')

  return fs.existsSync(filePath)
    ? JSON.parse(fs.readFileSync(filePath, 'utf8'))
    : {}
}
/**
 * Extracts the paths from the web tsconfig.json file
 * @returns The paths object from the web tsconfig.json file
 */
export const getPathsFromWebTsconfig = () => {
  return getPathsFromTsconfig(readTsconfig(getPaths().web.base))
}
/**
 * Extracts the paths from the api tsconfig.json file
 * @returns The paths object from the api tsconfig.json file
 */
export const getPathsFromApiTsconfig = () => {
  return getPathsFromTsconfig(readTsconfig(getPaths().api.base))
}

/**
 * Extracts the paths from the tsconfig.json file
 * @param tsconfig The tsconfig object
 * @returns {Record<string, string>}  The paths object
 */
const getPathsFromTsconfig = (tsconfig: {
  compilerOptions: { baseUrl: string; paths: string }
}): Record<string, string> => {
  // These are the default paths that are included in the the tsconfig.json file
  const defaultPaths = ['src/*', '$api/*', 'types/*', '@redwood/testing']

  const { baseUrl, paths } = tsconfig.compilerOptions
  const pathsObj: Record<string, string> = {}
  for (const [key, value] of Object.entries(paths)) {
    // exclude the default paths
    if (defaultPaths.includes(key)) {
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
