import path from 'path'

import { getConfig } from './config'
import { getPaths, resolveFile } from './paths'

/**
 * Checks to see if the user has the experimental server file present at api/src/server.ts|js and enabled in redwood.toml
 */
export function isUsingExperimentalServerFile() {
  return (
    getConfig().experimental?.serverFile?.enabled &&
    resolveFile(path.join(getPaths().api.src, 'server')) !== null
  )
}
