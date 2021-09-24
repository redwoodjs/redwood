import fs from 'fs'
import path from 'path'

import { getPaths } from '@redwoodjs/internal'

import runTransform from '../../../lib/runTransform'

export const command = 'add-prisma-create-to-scenarios'
export const description = 'Adds the data key to scenarios...'

// use apply transform instead?
export const handler = () => {
  const paths = getPaths()

  const targetPaths: string[] = []

  /**
   * The services dir looks like...
   *
   * services
   * |- users
   *    |- users.js
   *    |- users.scenario.js
   *    |- users.test.js
   * |- posts
   *    |- post.js
   *    |- post.scenario.js
   *    |- post.test.js
   */
  fs.readdirSync(paths.api.services, { withFileTypes: true }).forEach(
    (service) => {
      service.isDirectory() &&
        fs
          .readdirSync(path.join(paths.api.services, service.name))
          .forEach((file) => {
            if (file.endsWith('.scenarios.js')) {
              targetPaths.push(
                path.join(paths.api.services, service.name, file)
              )
            }
          })
    }
  )

  runTransform({
    transformPath: path.join(__dirname, 'addPrismaCreateToScenarios.js'),
    targetPaths,
  })
}
