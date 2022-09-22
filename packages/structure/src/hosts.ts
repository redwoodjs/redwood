import * as fs from 'fs-extra'
import glob from 'glob'

import type { Paths } from '@redwoodjs/internal/dist/paths'
import { getPaths } from '@redwoodjs/internal/dist/paths'

import { lazy } from './x/decorators'

/**
 * The host interface allows us to decouple the "model/*"
 * classes from access to the file system.
 * This is critical for editor support (ex: showing diagnostics on unsaved files)
 */
export interface Host {
  existsSync(path: string): boolean
  readFileSync(path: string): string
  readdirSync(path: string): string[]
  globSync(pattern: string): string[]
  writeFileSync(path: string, contents: string): void
  paths: Paths
}

export class DefaultHost implements Host {
  existsSync(path: string) {
    return fs.existsSync(path)
  }
  readFileSync(path: string) {
    return fs.readFileSync(path, { encoding: 'utf8' }).toString()
  }
  readdirSync(path: string) {
    return fs.readdirSync(path)
  }
  globSync(pattern: string) {
    return glob.sync(pattern)
  }
  writeFileSync(path: string, contents: string) {
    return fs.writeFileSync(path, contents)
  }
  @lazy()
  get paths() {
    return getPaths()
  }
}
