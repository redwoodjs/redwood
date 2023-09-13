import fs from 'fs'
import path from 'path'

import * as esbuild from 'esbuild'
import { removeSync } from 'fs-extra'

import {
  getApiSideBabelPlugins,
  prebuildApiFile,
} from '@redwoodjs/babel-config'
import { getPaths, getConfig } from '@redwoodjs/project-config'

import { findApiFiles } from '../files'

export const buildApi = () => {
  // TODO: Be smarter about caching and invalidating files,
  // but right now we just delete everything.
  cleanApiBuild()

  const srcFiles = findApiFiles()

  const prebuiltFiles = prebuildApiFiles(srcFiles).filter(
    (path): path is string => path !== undefined
  )

  return transpileApi(prebuiltFiles)
}

export const cleanApiBuild = () => {
  const rwjsPaths = getPaths()
  removeSync(rwjsPaths.api.dist)
  removeSync(path.join(rwjsPaths.generated.prebuild, 'api'))
}

/**
 * Remove RedwoodJS "magic" from a user's code leaving JavaScript behind.
 */
export const prebuildApiFiles = (srcFiles: string[]) => {
  const rwjsPaths = getPaths()
  const plugins = getApiSideBabelPlugins({
    openTelemetry: getConfig().experimental.opentelemetry.enabled,
  })

  return srcFiles.map((srcPath) => {
    const relativePathFromSrc = path.relative(rwjsPaths.base, srcPath)
    const dstPath = path
      .join(rwjsPaths.generated.prebuild, relativePathFromSrc)
      .replace(/\.(ts)$/, '.js')

    const result = prebuildApiFile(srcPath, dstPath, plugins)
    if (!result?.code) {
      // TODO: Figure out a better way to return these programatically.
      console.warn('Error:', srcPath, 'could not prebuilt.')

      return undefined
    }

    fs.mkdirSync(path.dirname(dstPath), { recursive: true })
    fs.writeFileSync(dstPath, result.code)

    return dstPath
  })
}

export const transpileApi = (files: string[], options = {}) => {
  const rwjsPaths = getPaths()

  return esbuild.buildSync({
    absWorkingDir: rwjsPaths.api.base,
    entryPoints: files,
    platform: 'node',
    target: 'node18',
    format: 'cjs',
    bundle: false,
    outdir: rwjsPaths.api.dist,
    // setting this to 'true' will generate an external sourcemap x.js.map
    // AND set the sourceMappingURL comment
    // (setting it to 'external' will ONLY generate the file, but won't add the comment)
    sourcemap: true,
    ...options,
  })
}
