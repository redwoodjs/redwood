import fs from 'fs'
import path from 'path'

import * as esbuild from 'esbuild'
import { moveSync, removeSync } from 'fs-extra'

import { findApiServerFunctions } from '../files'
import { ensurePosixPath, getPaths } from '../paths'

import { getApiSideBabelPlugins, prebuildApiFile } from './babel/api'

export const buildApi = async () => {
  // TODO: Be smarter about caching and invalidating files,
  // but right now we just delete everything.
  cleanApiBuild()

  // findApiFiles()
  //   .filter((path): path is string => path !== undefined)
  //   .flatMap(generateProxyFilesForNestedFunction)

  // prebuildApiFiles(srcFiles)
  //   .filter((path): path is string => path !== undefined)
  //   .flatMap(generateProxyFilesForNestedFunction)

  // const functionsPath = path.join(
  //   getPaths().generated.prebuild,
  //   'api/src/functions'
  // )
  // const preTranspiledApiFunctions = findApiServerFunctions(functionsPath)

  return await transpileApi([...findApiServerFunctions()])
}

export const cleanApiBuild = () => {
  const rwjsPaths = getPaths()
  removeSync(rwjsPaths.api.dist)
  removeSync(path.join(rwjsPaths.generated.prebuild, 'api'))
}

/**
 * Takes prebuilt api files, and will generate proxy functions where required
 *  If the function is nested in a folder, put it into the special _build directory
 *  at the same level as functions, then re-export it.
 *
 * This allows for support for nested functions across all our supported providers,
 * (Netlify, Vercel, Render, Self-hosted) - and they behave consistently
 *
 * Note that this function takes prebuilt files in the .redwood/prebuild directory
 *
 */
export const generateProxyFilesForNestedFunction = (prebuiltFile: string) => {
  const rwjsPaths = getPaths()

  const relativePathFromFunctions = path.relative(
    path.join(rwjsPaths.generated.prebuild, 'api/src/functions'),
    prebuiltFile
  )
  const folderName = path.dirname(relativePathFromFunctions)

  const isNestedFunction =
    ensurePosixPath(prebuiltFile).includes('api/src/functions') &&
    folderName !== '.'

  if (isNestedFunction) {
    const { name: fileName } = path.parse(relativePathFromFunctions)
    const isIndexFile = fileName === 'index'

    // .redwood/prebuilds/api/src/_build/{folder}/{fileName}
    const nestedFunctionOutputPath = path
      .join(
        rwjsPaths.generated.prebuild,
        'api/src/_nestedFunctions',
        relativePathFromFunctions
      )
      .replace(/\.(ts)$/, '.js')

    // move existing file into the new nestedOutputPath
    // @Note: use fs-extra.moveSync for compatibility under docker and linux
    moveSync(prebuiltFile, nestedFunctionOutputPath)

    // Only generate proxy files for the function
    if (fileName === folderName || isIndexFile) {
      // .redwood/prebuild/api/src/functions/{folderName}.js
      const reExportPath =
        path.join(
          rwjsPaths.generated.prebuild,
          'api/src/functions',
          folderName
        ) + '.js'

      const importString = isIndexFile
        ? `../_nestedFunctions/${folderName}`
        : `../_nestedFunctions/${folderName}/${folderName}`

      const reExportContent = `export * from '${importString}';`

      fs.writeFileSync(reExportPath, reExportContent)

      return [nestedFunctionOutputPath, reExportPath]
    } else {
      // other files in the folder e.g. functions/helloWorld/otherFile.js

      return [nestedFunctionOutputPath]
    }
  }

  // If no post-processing required
  return [prebuiltFile]
}

/**
 * Remove RedwoodJS "magic" from a user's code leaving JavaScript behind.
 */
export const prebuildApiFiles = (srcFiles: string[]) => {
  const rwjsPaths = getPaths()
  const plugins = getApiSideBabelPlugins()

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

const makeAllNodeModulesExternalPlugin = {
  name: 'make-all-node-modules-external',
  setup(build: esbuild.PluginBuild) {
    const filter = /^[^.\/]|^\.[^.\/]|^\.\.[^\/]/ // Must not start with "/" or "./" or "../"
    build.onResolve({ filter }, (args) => {
      return {
        path: args.path,
        external: true,
      }
    })
  },
}

const runRwBabelTransformsPlugin = {
  name: 'rw-babel-transform',
  setup(build: esbuild.PluginBuild) {
    build.onLoad({ filter: /.(js|ts)$/ }, async (args) => {
      const transformedCode = prebuildApiFile(
        args.path,
        '',
        getApiSideBabelPlugins()
      )

      if (transformedCode?.code) {
        return {
          contents: transformedCode.code,
          loader: 'js',
        }
      }
      // @TODO handle babel error
      return null
    })
  },
}

export const transpileApi = (files: string[], options = {}) => {
  const rwjsPaths = getPaths()

  return esbuild.build({
    absWorkingDir: rwjsPaths.api.base,
    entryPoints: files,
    platform: 'node',
    target: 'node12', // Netlify defaults NodeJS 12: https://answers.netlify.com/t/aws-lambda-now-supports-node-js-14/31789/3
    format: 'cjs',
    bundle: true,
    plugins: [makeAllNodeModulesExternalPlugin, runRwBabelTransformsPlugin],
    outdir: path.join(rwjsPaths.api.dist, 'functions'),
    // setting this to 'true' will generate an external sourcemap x.js.map
    // AND set the sourceMappingURL comment
    // (setting it to 'external' will ONLY generate the file, but won't add the comment)
    sourcemap: true,
    ...options,
  })
}
