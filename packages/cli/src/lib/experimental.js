import path from 'path'

import { getConfig, getPaths, resolveFile } from '@redwoodjs/project-config'

/**
 * Checks to see if the user has the experimental server file present at api/src/server.ts|js and enabled in redwood.toml
 *
 * @returns {boolean} true if the experimental server file is enabled and present
 */
export function isUsingExperimentalServerFile() {
  return (
    getConfig().experimental?.serverFile?.enabled &&
    resolveFile(path.join(getPaths().api.src, 'server'))
  )
}
