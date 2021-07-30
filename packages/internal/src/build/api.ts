import fs from 'fs'
import path from 'path'

import { transform, TransformOptions } from '@babel/core'
import { buildSync } from 'esbuild'
import rimraf from 'rimraf'

import { findApiFiles } from '../files'
import { getPaths } from '../paths'

export const buildApi = () => {
  // TODO: Be smarter about caching and invalidating files,
  // but right now we just delete everything.
  cleanApiBuild()

  const srcFiles = findApiFiles()

  const prebuiltFiles = prebuildApiFiles(srcFiles).filter(
    (x) => typeof x !== 'undefined'
  ) as string[]

  return transpileApi(prebuiltFiles)
}

export const cleanApiBuild = () => {
  const rwjsPaths = getPaths()
  rimraf.sync(rwjsPaths.api.dist)
  rimraf.sync(path.join(rwjsPaths.generated.prebuild, 'api'))
}

export const getPrebuildOutputOptions = (
  srcPath: string
): [string, { reExportPath: null | string; reExportContent?: string }] => {
  const rwjsPaths = getPaths()
  const relativeSrcPath = path.relative(rwjsPaths.base, srcPath) //?

  if (relativeSrcPath.includes('api/src/functions')) {
    // special checks for api functions
    const relativePathFromFunctions = path.relative(
      rwjsPaths.api.functions,
      srcPath
    ) //?
    const folderName = path.dirname(relativePathFromFunctions) //?

    // If the function is nested in a folder
    // put it into the special _build directory at the same level as functions
    // then re-export it
    if (folderName !== '.') {
      const _buildOutputPath = path
        .join(
          rwjsPaths.generated.prebuild,
          'api/src/_build',
          relativePathFromFunctions
        )
        .replace(/\.(ts)$/, '.js')

      const reExportPath =
        path.join(
          rwjsPaths.generated.prebuild,
          'api/src/functions',
          folderName
        ) + '.js'

      const { name: fileName } = path.parse(relativePathFromFunctions) //?
      const importString =
        fileName === 'index'
          ? `../_build/${folderName}`
          : `../_build/${folderName}/${folderName}`

      const reExportContent = `export * from '${importString}';`
      return [_buildOutputPath, { reExportPath, reExportContent }]
    }
  }

  // default case
  return [
    path
      .join(rwjsPaths.generated.prebuild, relativeSrcPath)
      .replace(/\.(ts)$/, '.js'),
    { reExportPath: null },
  ] // TODO: Figure out a better way to handle extensions
}

/**
 * Remove RedwoodJS "magic" from a user's code leaving JavaScript behind.
 */
export const prebuildApiFiles = (srcFiles: string[]) => {
  const plugins = getBabelPlugins()

  return srcFiles.flatMap((srcPath) => {
    // @MARK Intentionally not passing cwd api.base here, because otherwise
    // it picks up babel settings from src/api/.babelrc.js
    const result = prebuildFile(srcPath, plugins)

    if (!result?.code) {
      // TODO: Figure out a better way to return these programatically.
      console.warn('Error:', srcPath, 'could not prebuilt.')

      return undefined
    }

    const [dstPath, options] = getPrebuildOutputOptions(srcPath) //?

    if (options.reExportPath && options.reExportContent) {
      // create rexport function
      fs.writeFileSync(options.reExportPath, options.reExportContent)
    }

    fs.mkdirSync(path.dirname(dstPath), { recursive: true })
    fs.writeFileSync(dstPath, result.code)

    return [dstPath, options.reExportPath && options.reExportPath].filter(
      Boolean
    )
  })
}

// TODO: This can be shared between the api and web sides, but web
// needs to determine plugins on a per-file basis for web side.
export const prebuildFile = (
  srcPath: string,
  plugins: TransformOptions['plugins'],
  cwd: string = getPaths().base
) => {
  const code = fs.readFileSync(srcPath, 'utf-8')
  const result = transform(code, {
    cwd,
    filename: srcPath,
    configFile: false,
    plugins,
  })
  return result
}

export const getBabelPlugins = () => {
  const rwjsPaths = getPaths()
  const plugins = [
    ['@babel/plugin-transform-typescript'],
    [
      require('@redwoodjs/core/dist/babelPlugins/babel-plugin-redwood-src-alias'),
      {
        srcAbsPath: rwjsPaths.api.src,
      },
    ],
    [
      require('@redwoodjs/core/dist/babelPlugins/babel-plugin-redwood-directory-named-import'),
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
    ],
    // FIXME: Babel plugin GraphQL tag doesn't seem to be working.
    ['babel-plugin-graphql-tag'],
    [
      require('@redwoodjs/core/dist/babelPlugins/babel-plugin-redwood-import-dir'),
    ],
  ].filter(Boolean)
  return plugins as Array<any>
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
    sourcemap: 'external', // figure out what's best during development.
    ...options,
  })
}
