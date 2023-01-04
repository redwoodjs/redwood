import fs from 'fs'
import path from 'path'

import { fetch } from 'cross-undici-fetch'

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
  global.RWJS_API_GRAPHQL_URL =
    rwjsConfig.web.apiGraphQLUrl ?? `${rwjsConfig.web.apiUrl}graphql`
  global.__REDWOOD__APP_TITLE = rwjsConfig.web.title

  global.__REDWOOD__PRERENDERING = true

  global.__REDWOOD__HELMET_CONTEXT = {}

  // Let routes auto loader plugin know
  process.env.__REDWOOD__PRERENDERING = '1'

  // This makes code like global.location.pathname work also outside of the
  // router
  global.location = {
    ...global.location,
    pathname: routerPath,
  }
  // Shim fetch in the node.js context
  // This is to avoid using cross-fetch when configuring apollo-client
  // which would cause the client bundle size to increase
  if (!global.fetch) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore-next-line
    global.fetch = fetch
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
