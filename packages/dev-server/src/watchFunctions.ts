/* eslint-disable @typescript-eslint/ban-ts-ignore */
import path from 'path'

import chokidar, { FSWatcher } from 'chokidar'
import { NodeTargetPaths } from '@redwoodjs/internal'
// @ts-ignore
import babelRequireHook from '@babel/register'
import requireDir from 'require-dir'

const WATCHER_IGNORE_EXTENSIONS = ['.db', '.sqlite', '-journal']

declare class WatchFunctionsClass {
  functions: null
  watcher: FSWatcher
  paths: NodeTargetPaths

  importFunctions(): void
  setupBabelRequireHook(): void
}

export interface Functions {
  [path: string]: any
}

export class WatchFunctions implements WatchFunctionsClass {
  functions: null
  watcher: FSWatcher
  paths: NodeTargetPaths

  constructor(paths: NodeTargetPaths, onImport: { (files: Functions): void }) {
    this.setupBabelRequireHook()
    this.paths = paths

    this.importFunctions()

    this.watcher = chokidar.watch(this.paths.base, {
      ignored: (file: string) =>
        file.includes('node_modules') ||
        WATCHER_IGNORE_EXTENSIONS.some((ext) => file.endsWith(ext)),
    })
    this.watcher.on('ready', () => {
      this.watcher.on('all', () => {
        Object.keys(require.cache).forEach((key) => {
          delete require.cache[key]
        })
        const functions = this.importFunctions()
        onImport(functions)
      })
    })
  }

  /**
   * Use babel-register to add a require hook:
   * > The require hook will bind itself to node's require and automatically
   * > compile files on the fly.
   *
   * This will use the `.babelrc.js` configuration file in the base directory
   * of the project.
   */
  setupBabelRequireHook = (): void => {
    // Use babel-register to add a require hook so that when files are imported
    // they are transpiled with the user's babel configuration settings.
    babelRequireHook({
      extends: path.join(this.paths.base, '.babelrc.js'),
      extensions: ['.js', '.ts'],
      only: [this.paths.base],
      ignore: ['node_modules'],
      cache: false,
    })
  }

  importFunctions = (): Functions => {
    // type definitions for require-dir are outdated and don't know about
    // `extensions`
    return requireDir(this.paths.functions, {
      recurse: false,
      // @ts-ignore
      extensions: ['.js', '.ts'],
    })
  }
}
