import fs from 'fs'
import path from 'path'

import { parseConfigFileTextToJson } from 'typescript'

import { getPaths } from '@redwoodjs/project-config'

export const getTsConfigs = () => {
  const rwPaths = getPaths()
  const apiTsConfigPath = path.join(rwPaths.api.base, 'tsconfig.json')
  const webTsConfigPath = path.join(rwPaths.web.base, 'tsconfig.json')

  const apiTsConfig = fs.existsSync(apiTsConfigPath)
    ? parseConfigFileTextToJson(
        apiTsConfigPath,
        fs.readFileSync(apiTsConfigPath, 'utf-8')
      )
    : null

  const webTsConfig = fs.existsSync(webTsConfigPath)
    ? parseConfigFileTextToJson(
        webTsConfigPath,
        fs.readFileSync(webTsConfigPath, 'utf-8')
      )
    : null

  return {
    api: apiTsConfig?.config ?? null,
    web: webTsConfig?.config ?? null,
  }
}
