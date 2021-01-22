import fs from 'fs'
import path from 'path'

import type { AuthContextInterface } from '@redwoodjs/auth'
import { getConfig, getPaths } from '@redwoodjs/internal'

const INDEX_FILE = path.join(getPaths().web.dist, '/index.html')
const DEFAULT_INDEX = path.join(getPaths().web.dist, '/defaultIndex.html')

export const getRootHtmlPath = () => {
  if (fs.existsSync(DEFAULT_INDEX)) {
    return DEFAULT_INDEX
  } else {
    return INDEX_FILE
  }
}

export const registerShims = () => {
  global.__REDWOOD__API_PROXY_PATH = getConfig().web.apiProxyPath

  global.__REDWOOD__USE_AUTH = () =>
    ({
      loading: true, // this should play nicely if the app waits for auth stuff to comeback first before render
      isAuthenticated: false,
    } as AuthContextInterface) // we only need a parital AuthContextInterface for prerender

  global.__REDWOOD__PRERENDERING = true
}

export const writeToDist = (outputHtmlPath: string, renderOutput: string) => {
  const dirName = path.dirname(outputHtmlPath)
  const exist = fs.existsSync(dirName)
  if (!exist) {
    fs.mkdirSync(dirName, { recursive: true })
  }

  fs.writeFileSync(outputHtmlPath, renderOutput)
}
