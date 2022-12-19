import path from 'node:path'

import { pathExistsSync } from 'fs-extra'
import isPortReachable from 'is-port-reachable'

export function waitForServer(port, interval) {
  return new Promise((resolve) => {
    const watchInterval = setInterval(async () => {
      console.log(`Waiting for server at localhost:${port}....`)
      const isServerUp = await isPortReachable(port, { host: 'localhost' })
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
