import fs from 'fs'
import path from 'path'

import { removeSync } from 'fs-extra'

import { getPaths } from '@redwoodjs/project-config'

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
 *
 * Currently only used for debugging purposes
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

    fs.mkdirSync(path.dirname(dstPath), { recursive: true })
    fs.writeFileSync(dstPath, result.code)

    return dstPath
  })
}

interface BuildOptions {
  verbose?: boolean
}

/**
 *
 * @WARN: This is currently only used in testing
 * Builds the web side with Vite
 *
 */
export const buildWeb = async ({ verbose }: BuildOptions) => {
  // @NOTE: Using dynamic import, because vite is still opt-in
  // TODO: Make this a regular import for RW v7 where Vite'll be the only option
  const { build } = await import('vite')
  const rwPaths = getPaths()

  const viteConfig = rwPaths.web.viteConfig

  if (!viteConfig) {
    throw new Error('Could not locate your web/vite.config.{js,ts} file')
  }

  // @NOTE: necessary for keeping the cwd correct for CSS processing, i.e.
  // postcss and tailwind
  process.chdir(rwPaths.web.base)
  process.env.NODE_ENV = 'production'

  return build({
    configFile: viteConfig,
    envFile: false,
    logLevel: verbose ? 'info' : 'warn',
  })
}
