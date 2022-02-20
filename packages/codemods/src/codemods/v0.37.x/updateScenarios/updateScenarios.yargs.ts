import path from 'path'

import fg from 'fast-glob'
import task from 'tasuku'

import getRWPaths from '../../../lib/getRWPaths'
import runTransform from '../../../lib/runTransform'

export const command = 'update-scenarios'
export const description =
  "(v0.36->v0.37) Updates Scenarios (adds Prisma create's data key)"

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
  task('Updating Scenarios', async () => {
    await runTransform({
      transformPath: path.join(__dirname, 'updateScenarios.js'),
      targetPaths: fg.sync('api/src/services/**/*.scenarios.{js,ts}', {
        cwd: getRWPaths().base,
        absolute: true,
      }),
    })
  })
}
