import fs from 'fs'
import path from 'path'

import { transform, TransformOptions } from '@babel/core'
import { buildSync } from 'esbuild'
import { moveSync } from 'fs-extra'
import rimraf from 'rimraf'

import { findApiFiles } from '../files'
import { ensurePosixPath, getPaths } from '../paths'

export const buildApi = () => {
  // TODO: Be smarter about caching and invalidating files,
  // but right now we just delete everything.
  cleanApiBuild()

  const srcFiles = findApiFiles()

  const prebuiltFiles = prebuildApiFiles(srcFiles)
    .filter((path): path is string => path !== undefined)
    .flatMap(generateProxyFilesForNestedFunction)

  return transpileApi(prebuiltFiles)
}

export const cleanApiBuild = () => {
  const rwjsPaths = getPaths()
  rimraf.sync(rwjsPaths.api.dist)
  rimraf.sync(path.join(rwjsPaths.generated.prebuild, 'api'))
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
  const plugins = getBabelPlugins()
  const rwjsPaths = getPaths()

  return srcFiles.map((srcPath) => {
    const relativePathFromSrc = path.relative(rwjsPaths.base, srcPath)
    const dstPath = path
      .join(rwjsPaths.generated.prebuild, relativePathFromSrc)
      .replace(/\.(ts)$/, '.js')

    const result = prebuildFile(srcPath, dstPath, plugins)
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

export const getApiSideBabelConfigPath = () => {
  const p = path.join(getPaths().api.base, 'babel.config.js')
  if (fs.existsSync(p)) {
    return p
  } else {
    return false
  }
}

// TODO: This can be shared between the api and web sides, but web
// needs to determine plugins on a per-file basis for web side.
export const prebuildFile = (
  srcPath: string,
  // we need to know dstPath as well
  // so we can generate an inline, relative sourcemap
  dstPath: string,
  plugins: TransformOptions['plugins']
) => {
  const code = fs.readFileSync(srcPath, 'utf-8')
  const result = transform(code, {
    cwd: getPaths().api.base,
    filename: srcPath,
    configFile: getApiSideBabelConfigPath(),
    // we set the sourceFile (for the sourcemap) as a correct, relative path
    // this is why this function (prebuildFile) must know about the dstPath
    sourceFileName: path.relative(path.dirname(dstPath), srcPath),
    // we need inline sourcemaps at this level
    // because this file will eventually be fed to esbuild
    // when esbuild finds an inline sourcemap, it tries to "combine" it
    // so the final sourcemap (the one that esbuild generates) combines both mappings
    sourceMaps: 'inline',
    plugins,
  })
  return result
}

export const getBabelPlugins = () => {
  const rwjsPaths = getPaths()
  // Plugin shape: [ ["Target", "Options", "name"] ],
  // a custom "name" is supplied so that user's do not accidently overwrite
  // Redwood's own plugins.
  const plugins: TransformOptions['plugins'] = [
    ['@babel/plugin-transform-typescript', undefined, 'rwjs-babel-typescript'],
    [
      require('@redwoodjs/core/dist/babelPlugins/babel-plugin-redwood-src-alias'),
      {
        srcAbsPath: rwjsPaths.api.src,
      },
      'rwjs-babel-src-alias',
    ],
    [
      require('@redwoodjs/core/dist/babelPlugins/babel-plugin-redwood-directory-named-import'),
      undefined,
      'rwjs-babel-directory-named-modules',
    ],
    [
      'babel-plugin-auto-import',
      {
        declarations: [
          {
            // import gql from 'graphql-tag'
            default: 'gql',
            path: 'graphql-tag',
          },
          {
            // import { context } from '@redwoodjs/api'
            members: ['context'],
            path: '@redwoodjs/api',
          },
        ],
      },
      'rwjs-babel-auto-import',
    ],
    // FIXME: Babel plugin GraphQL tag doesn't seem to be working.
    ['babel-plugin-graphql-tag', undefined, 'rwjs-babel-graphql-tag'],
    [
      require('@redwoodjs/core/dist/babelPlugins/babel-plugin-redwood-import-dir'),
      undefined,
      'rwjs-babel-glob-import-dir',
    ],
  ].filter(Boolean)
  return plugins
}

export const transpileApi = (files: string[], options = {}) => {
  const rwjsPaths = getPaths()

  return buildSync({
    absWorkingDir: rwjsPaths.api.base,
    entryPoints: files,
    platform: 'node',
    target: 'node12.21', // AWS Lambdas support NodeJS 12.x and 14.x, but what does Netlify Target?
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
