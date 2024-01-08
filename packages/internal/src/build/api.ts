import type { Format, Platform, PluginBuild, BuildContext } from 'esbuild'
import { build, context } from 'esbuild'
import { remove } from 'fs-extra'

import {
  getApiSideBabelPlugins,
  transformWithBabel,
} from '@redwoodjs/babel-config'
import { getConfig, getPaths } from '@redwoodjs/project-config'

import { findApiFiles } from '../files'

let BUILD_CTX: BuildContext | null = null

export const buildApi = async () => {
  // Reset the build context for rebuildling
  BUILD_CTX = null

  return transpileApi(findApiFiles())
}

export const rebuildApi = async () => {
  const apiFiles = findApiFiles()

  if (!BUILD_CTX) {
    BUILD_CTX = await context(getEsbuildOptions(apiFiles))
  }

  console.log('definitely rebuilding!!')
  console.log('definitely rebuilding!!')
  console.log('definitely rebuilding!!')
  console.log('definitely rebuilding!!')
  return BUILD_CTX.rebuild()
}

export const cleanApiBuild = async () => {
  const rwjsPaths = getPaths()
  return remove(rwjsPaths.api.dist)
}

const runRwBabelTransformsPlugin = {
  name: 'rw-esbuild-babel-transform',
  setup(build: PluginBuild) {
    const rwjsConfig = getConfig()

    build.onLoad({ filter: /\.(js|ts|tsx|jsx)$/ }, async (args) => {
      // @TODO Implement LRU cache? Unsure how much of a performance benefit its going to be
      // Generate a CRC of file contents, then save it to LRU cache with a limit
      // without LRU cache, the memory usage can be come unbound
      const transformedCode = await transformWithBabel(
        args.path,
        getApiSideBabelPlugins({
          openTelemetry:
            rwjsConfig.experimental.opentelemetry.enabled &&
            rwjsConfig.experimental.opentelemetry.wrapApi,
        })
      )

      if (transformedCode?.code) {
        return {
          contents: transformedCode.code,
          loader: 'js',
        }
      }

      throw new Error(`Could not transform file: ${args.path}`)
    })
  },
}

export const transpileApi = async (files: string[]) => {
  return build(getEsbuildOptions(files))
}

function getEsbuildOptions(files: string[]) {
  const rwjsPaths = getPaths()

  return {
    absWorkingDir: rwjsPaths.api.base,
    entryPoints: files,
    platform: 'node' as Platform,
    target: 'node20',
    format: 'cjs' as Format,
    allowOverwrite: true,
    bundle: false,
    plugins: [runRwBabelTransformsPlugin],
    outdir: rwjsPaths.api.dist,
    // setting this to 'true' will generate an external sourcemap x.js.map
    // AND set the sourceMappingURL comment
    // (setting it to 'external' will ONLY generate the file, but won't add the comment)
    sourcemap: true,
  }
}
