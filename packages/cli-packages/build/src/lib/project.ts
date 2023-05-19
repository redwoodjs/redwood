import fs from 'fs'
import path from 'path'

import { memoize } from 'lodash'

import {
  getPaths as getRedwoodPaths,
  getConfig as getRedwoodConfig,
} from '@redwoodjs/project-config'

import { RedwoodSide } from '../types'

import c from './colors'

/**
 * This wraps the core version of getPaths into something that catches the exception
 * and displays a helpful error message.
 */
export const _getPaths = () => {
  try {
    return getRedwoodPaths()
  } catch (e) {
    console.error(c.error((e as Error).message))
    process.exit(1)
  }
}
export const getPaths = memoize(_getPaths)

export const getConfig = () => {
  try {
    return getRedwoodConfig()
  } catch (e) {
    console.error(c.error((e as Error).message))
    process.exit(1)
  }
}

export const sides = () => {
  const paths = getPaths()

  let sides: RedwoodSide[] = []
  if (fs.existsSync(path.join(paths.web.base, 'package.json'))) {
    sides = [...sides, 'web']
  }
  if (fs.existsSync(path.join(paths.api.base, 'package.json'))) {
    sides = [...sides, 'api']
  }
  return sides
}
