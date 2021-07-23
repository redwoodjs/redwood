// TODO: This file "watches" side for changes, but it's out of scope the "dev-server"
// package.
// Ideally a user will be able to deploy the "dev-server"/ "redwood-http-server" on
// their own infrastructure, in which case the ability to live-reload changes doesn't
// make sense.

import path from 'path'

import babelRequireHook from '@babel/register'
import chokidar from 'chokidar'
import requireDir from 'require-dir'

import { getPaths, NodeTargetPaths } from '@redwoodjs/internal'

const WATCHER_IGNORE_EXTENSIONS = [
  '.db',
  '.sqlite',
  '-journal',
  '.test.js',
  '.test.ts',
  '.scenarios.ts',
  '.scenarios.js',
  '.d.ts',
]

export interface Functions {
  [path: string]: any
}

/**
 * Purge the require cache and import them again.
 */
export const importFreshFunctions = (functionsPath: string): Functions => {
  Object.keys(require.cache).forEach((key) => {
    delete require.cache[key]
  })

  return requireDir(functionsPath, {
    recurse: false,
    extensions: ['.js', '.ts'],
  })
}

export const watchFunctions = ({
  paths,
  onChange,
  onImport,
  onException,
}: {
  paths: NodeTargetPaths
  onChange: (event: string, path: string) => void
  onImport: (functions: Functions) => void
  onException: (e: Error) => void
}): void => {
  // Use babel-register to add a require hook:
  // > The require hook will bind itself to node's require and automatically
  // > compile files on the fly.
  //
  // This will use the `.babelrc.js` configuration file in the base directory
  // of the project, usually `./api/.babelrc.js`
  babelRequireHook({
    extends: path.join(paths.base, '.babelrc.js'),
    extensions: ['.js', '.ts'],
    only: [paths.base],
    ignore: ['node_modules'],
    cache: false,
  })

  const rwjsPaths = getPaths()

  try {
    const functions = importFreshFunctions(paths.functions)
    onImport(functions)
  } catch (e) {
    onException(e)
  }

  const watcher = chokidar.watch(paths.base, {
    ignored: (file: string) =>
      file.includes('node_modules') ||
      file.includes(rwjsPaths.api.dist) ||
      file.includes(rwjsPaths.api.types) ||
      file.includes(rwjsPaths.api.db) ||
      WATCHER_IGNORE_EXTENSIONS.some((ext) => file.endsWith(ext)),
  })
  watcher.on('ready', () => {
    watcher.on('all', (event, path) => {
      onChange(event, path)
      try {
        const functions = importFreshFunctions(paths.functions)
        onImport(functions)
      } catch (e) {
        console.log()
        onException(e)
      }
    })
  })
}
