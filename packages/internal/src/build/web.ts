import fs from 'fs'
import path from 'path'

import { removeSync } from 'fs-extra'

import { prebuildWebFile } from '@redwoodjs/babel-config'
import type { Flags } from '@redwoodjs/babel-config'
import { getPaths } from '@redwoodjs/project-config'

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
 * Builds the web side with Vite, but not used in the buildHandler currently
 * because we want to set the process.cwd to web.base
 */
export const buildWeb = async ({ verbose }: BuildOptions) => {
  // @NOTE: Using dynamic import, because vite is still opt-in
  const { build } = await import('vite')
  const viteConfig = getPaths().web.viteConfig

  if (process.cwd() !== getPaths().web.base) {
    throw new Error(
      'Looks like you are running the command from the wrong dir, this can lead to unintended consequences on CSS processing'
    )
  }

  if (!viteConfig) {
    throw new Error('Could not locate your web/vite.config.{js,ts} file')
  }

  return build({
    configFile: viteConfig,
    envFile: false,
    logLevel: verbose ? 'info' : 'warn',
  })
}
