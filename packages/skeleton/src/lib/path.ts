import path from 'path'

import { getBaseDir, getConfigPath } from '@redwoodjs/internal/dist/index'

/**
 * Determines the root path of a redwood project which contains the provided path
 * @param pathWithinProject A path within a redwood project
 * @returns The root path of the associated project
 */
export function getRootPath(pathWithinProject: string) {
  return pathWithinProject
    ? path.dirname(getConfigPath(pathWithinProject))
    : getBaseDir()
}
