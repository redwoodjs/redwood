import path from 'path'

import * as esbuild from 'esbuild'
import { removeSync } from 'fs-extra'

import { findApiLibFunctions, findApiServerFunctions } from '../files'
import { getPaths } from '../paths'

import { getApiSideBabelPlugins, prebuildApiFile } from './babel/api'

export const buildApi = async () => {
  // TODO: Be smarter about caching and invalidating files,
  // but right now we just delete everything.
  cleanApiBuild()

  return await transpileApi([
    ...findApiServerFunctions(),
    ...findApiLibFunctions(),
  ])
}

export const cleanApiBuild = () => {
  const rwjsPaths = getPaths()
  removeSync(rwjsPaths.api.dist)
  removeSync(path.join(rwjsPaths.generated.prebuild, 'api'))
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

    // Make everything in ./api/src/lib/* external
    const srcLibFilter = /\.\/lib\//
    build.onResolve({ filter: srcLibFilter }, (args) => {
      // Reconstruct the lib import, so that wherever the import is from
      // We import from ./dist/lib/{relativeImportFromLib}
      // Essentially convert the relative import to an absolute one
      // NOTE: Maybe we could do this in the babel plugin instead?
      const absoluteLibImport = path.resolve(args.resolveDir, args.path)
      const relativeImportFromLib = path.relative(
        getPaths().api.lib,
        absoluteLibImport
      )

      const pathToDistLib = path.join(
        path.join(getPaths().api.dist, 'lib'),
        relativeImportFromLib
      )

      return {
        path: pathToDistLib,
        external: true,
        namespace: 'rwjs-src-lib',
      }
    })
  },
}

// const srcLibExternals = {
//   name: 'srcLibExternals',
//   setup(build: esbuild.PluginBuild) {
//     const srcLibFilter = /\.\/lib\//
//     build.onResolve({ filter: srcLibFilter }, (args) => {
//       return {
//         path: args.path, //?
//         external: true,
//       }
//     })
//   },
// }

const runRwBabelTransformsPlugin = {
  name: 'rw-babel-transform',
  setup(build: esbuild.PluginBuild) {
    build.onLoad({ filter: /.(js|ts)$/ }, async (args) => {
      // @TODO add crc / hash checks here, to only transpile if file content has changed
      // otherwise use esbuild cache

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
    // outbase: rwjsPaths.api.dist,
    platform: 'node',
    target: 'node12', // Netlify defaults NodeJS 12: https://answers.netlify.com/t/aws-lambda-now-supports-node-js-14/31789/3
    format: 'cjs',
    bundle: true,
    plugins: [
      makeAllNodeModulesExternalPlugin,
      runRwBabelTransformsPlugin,
      // srcLibExternals,
    ],
    outdir: rwjsPaths.api.dist,
    // setting this to 'true' will generate an external sourcemap x.js.map
    // AND set the sourceMappingURL comment
    // (setting it to 'external' will ONLY generate the file, but won't add the comment)
    sourcemap: true,
    ...options,
  })
}
