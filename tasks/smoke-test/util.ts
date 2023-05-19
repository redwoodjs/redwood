import path from 'node:path'

import { pathExistsSync } from 'fs-extra'
import isPortReachable from 'is-port-reachable'

interface Options {
  interval?: number
  host?: string
}

// On Node.js 18, when using `yarn rw serve`, we have to pass '127.0.0.1'
// instead of 'localhost'. See https://github.com/nodejs/node/issues/40537
export function waitForServer(port, options?: Options) {
  const interval = options?.interval || 1_000
  const host = options?.host || 'localhost'

  return new Promise((resolve) => {
    const watchInterval = setInterval(async () => {
      console.log(`Waiting for server at localhost:${port}....`)
      const isServerUp = await isPortReachable(port, { host })
      if (isServerUp) {
        clearInterval(watchInterval)
        resolve(true)
      }
    }, interval)
  })
}

export const projectNeedsBuilding = (
  projectPath: string = process.env.PROJECT_PATH || ''
) => {
  const webDist = path.join(projectPath, 'web/dist')
  const apiDist = path.join(projectPath, 'api/dist')
  return !pathExistsSync(webDist) || !pathExistsSync(apiDist)
}
