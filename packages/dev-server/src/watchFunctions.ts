/* eslint-disable @typescript-eslint/ban-ts-ignore */
import path from 'path'

import chokidar, { FSWatcher } from 'chokidar'
import { NodeTargetPaths } from '@redwoodjs/internal'
// @ts-ignore
import babelRequireHook from '@babel/register'
import requireDir from 'require-dir'

const WATCHER_IGNORE_EXTENSIONS = ['.db', '.sqlite', '-journal']

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
    // @ts-ignore
    // type definitions for require-dir are outdated and don't know about `extensions`
    extensions: ['.js', '.ts'],
  })
}

export const watchFunctions = ({
  paths,
  onChange,
  onImport,
}: {
  paths: NodeTargetPaths
  onChange: (event: string, path: string) => void
  onImport: (functions: Functions) => void
}): void => {
  // Use babel-register to add a require hook:
  // > The require hook will bind itself to node's require and automatically
  // > compile files on the fly.
  //
  // This will use the `.babelrc.js` configuration file in the base directory
  // of the project.
  babelRequireHook({
    extends: path.join(paths.base, '.babelrc.js'),
    extensions: ['.js', '.ts'],
    only: [paths.base],
    ignore: ['node_modules'],
    cache: false,
  })

  const functions = importFreshFunctions(paths.functions)
  onImport(functions)

  const watcher = chokidar.watch(paths.base, {
    ignored: (file: string) =>
      file.includes('node_modules') ||
      WATCHER_IGNORE_EXTENSIONS.some((ext) => file.endsWith(ext)),
  })
  watcher.on('ready', () => {
    watcher.on('all', (event, path) => {
      onChange(event, path)
      const functions = importFreshFunctions(paths.functions)
      onImport(functions)
    })
  })
}
