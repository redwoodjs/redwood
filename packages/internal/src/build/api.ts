import path from 'path'

import { build } from 'esbuild'
import type { PluginBuild } from 'esbuild'
import { removeSync } from 'fs-extra'

import { findApiFiles } from '../files'
import { getPaths } from '../paths'

import { getApiSideBabelPlugins, transformWithBabel } from './babel/api'

export const buildApi = async () => {
  // TODO: Be smarter about caching and invalidating files,
  // but right now we just delete everything.
  cleanApiBuild()
  return transpileApi(findApiFiles())
}

export const cleanApiBuild = () => {
  const rwjsPaths = getPaths()
  removeSync(rwjsPaths.api.dist)
  removeSync(path.join(rwjsPaths.generated.prebuild, 'api'))
}

const runRwBabelTransformsPlugin = {
  name: 'rw-esbuild-babel-transform',
  setup(build: PluginBuild) {
    build.onLoad({ filter: /\.(js|ts|tsx|jsx)$/ }, async (args) => {
      //  Remove RedwoodJS "magic" from a user's code leaving JavaScript behind.
      const transformedCode = transformWithBabel(
        args.path,
        getApiSideBabelPlugins()
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

export const transpileApi = async (files: string[], options = {}) => {
  const rwjsPaths = getPaths()

  return build({
    absWorkingDir: rwjsPaths.api.base,
    entryPoints: files,
    platform: 'node',
    target: 'node16',
    format: 'cjs',
    bundle: false,
    plugins: [runRwBabelTransformsPlugin],
    outdir: rwjsPaths.api.dist,
    // setting this to 'true' will generate an external sourcemap x.js.map
    // AND set the sourceMappingURL comment
    // (setting it to 'external' will ONLY generate the file, but won't add the comment)
    sourcemap: true,
    ...options,
  })
}
