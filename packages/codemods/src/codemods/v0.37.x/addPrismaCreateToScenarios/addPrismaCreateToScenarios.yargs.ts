import path from 'path'

import fg from 'fast-glob'
import task from 'tasuku'

import getRWPaths from '../../../lib/getRWPaths'
import runTransform from '../../../lib/runTransform'

export const command = 'add-prisma-create-to-scenarios'
export const description = 'Adds the data key to scenarios'

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
export const handler = () => {
  task('Add Prisma `create` to Scenarios', async () => {
    const rwPaths = getRWPaths()

    runTransform({
      transformPath: path.join(__dirname, 'addPrismaCreateToScenarios.js'),
      targetPaths: fg.sync(`${rwPaths.api.services}/**/*.scenarios.{js,ts}`),
    })
  })
}
