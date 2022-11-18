import { memoize } from 'lodash'

import {
  getPaths as getRedwoodPaths,
  resolveFile as internalResolveFile,
} from '@redwoodjs/internal/dist/paths'

import { colors } from './colors'

function isErrorWithMessage(e: any): e is { message: string } {
  return !!e.message
}

/**
 * This wraps the core version of getPaths into something that catches the exception
 * and displays a helpful error message.
 */
const _getPaths = () => {
  try {
    return getRedwoodPaths()
  } catch (e) {
    if (isErrorWithMessage(e)) {
      console.error(colors.error(e.message))
    }

    process.exit(1)
  }
}

export const getPaths = memoize(_getPaths)
export const resolveFile = internalResolveFile
