import path from 'path'

import fg from 'fast-glob'

import { getPaths } from '@redwoodjs/internal'

import runTransform from '../../../lib/runTransform'

export const command = 'add-prisma-create-to-scenarios'
export const description = 'Adds the data key to scenarios'

export const handler = () => {
  const paths = getPaths()

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
  runTransform({
    transformPath: path.join(__dirname, 'addPrismaCreateToScenarios.js'),
    targetPaths: fg.sync(`${paths.api.services}/**/*.scenarios.{js,ts}`),
  })
}
