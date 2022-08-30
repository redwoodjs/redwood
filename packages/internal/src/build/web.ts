import fs from 'fs'
import path from 'path'

import { removeSync } from 'fs-extra'

import { getPaths } from '../paths'

import { prebuildWebFile, Flags } from './babel/web'

// @MARK
// This whole file is currently only used in testing
// we may eventually use this to pretranspile the web side

export const cleanWebBuild = () => {
  const rwjsPaths = getPaths()
  removeSync(rwjsPaths.web.dist)
  removeSync(path.join(rwjsPaths.generated.prebuild, 'web'))
}

/**
 * Remove RedwoodJS "magic" from a user's code leaving JavaScript behind.
 */
export const prebuildWebFiles = (srcFiles: string[], flags?: Flags) => {
  const rwjsPaths = getPaths()

  return srcFiles.map((srcPath) => {
    const relativePathFromSrc = path.relative(rwjsPaths.base, srcPath)
    const dstPath = path
      .join(rwjsPaths.generated.prebuild, relativePathFromSrc)
      .replace(/\.(ts)$/, '.js')

    const result = prebuildWebFile(srcPath, flags)
    if (!result?.code) {
      console.warn('Error:', srcPath, 'could not prebuilt.')
      return undefined
    }

    // Fixes nodeFileTrace errors on windows when building
    let nodeFileTraceCompliantCode: string = result.code
    if (process.platform === 'win32') {
      nodeFileTraceCompliantCode = nodeFileTraceCompliantCode.replaceAll(
        '\\\\',
        '/'
      )
    }
    fs.mkdirSync(path.dirname(dstPath), { recursive: true })
    fs.writeFileSync(dstPath, nodeFileTraceCompliantCode)

    return dstPath
  })
}
