import memoize from 'lodash.memoize'

import { getPaths as getRedwoodPaths } from '@redwoodjs/project-config'

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
