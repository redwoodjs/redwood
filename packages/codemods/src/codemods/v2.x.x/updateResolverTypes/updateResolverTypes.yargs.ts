import path from 'path'

import fg from 'fast-glob'
import task from 'tasuku'

import getRWPaths from '../../../lib/getRWPaths'
import runTransform from '../../../lib/runTransform'

export const command = 'update-resolver-types'
export const description =
  '(v2.x.x->v2.x.x) Wraps types for "relation" resolvers in the bottom of service files'

export const handler = () => {
  task('Update Resolver Types', async ({ setOutput }: task.TaskInnerApi) => {
    await runTransform({
      transformPath: path.join(__dirname, 'updateResolverTypes.js'),
      // Target services written in TS only
      targetPaths: fg.sync('**/*.ts', {
        cwd: path.join(getRWPaths().api.services),
        ignore: [
          '**/node_modules/**',
          '**/*.test.{js,ts}',
          '**/*.scenarios.{js,ts}',
        ],
        absolute: true,
      }),
    })

    setOutput('All done! Run `yarn rw lint --fix` to prettify your code')
  })
}
