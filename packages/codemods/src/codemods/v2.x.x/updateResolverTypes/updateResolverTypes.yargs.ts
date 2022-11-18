import path from 'path'

import fg from 'fast-glob'
import task, { TaskInnerAPI } from 'tasuku'

import getRWPaths from '../../../lib/getRWPaths'
import runTransform from '../../../lib/runTransform'

export const command = 'update-resolver-types'
export const description =
  '(v2.x.x->v3.x.x) Wraps types for "relation" resolvers in the bottom of service files'

export const handler = () => {
  task('Update Resolver Types', async ({ setOutput }: TaskInnerAPI) => {
    await runTransform({
      transformPath: path.join(__dirname, 'updateResolverTypes.js'),
      // Target services written in TS only
      targetPaths: fg.sync('**/*.ts', {
        cwd: getRWPaths().api.services,
        ignore: ['**/node_modules/**', '**/*.test.ts', '**/*.scenarios.ts'],
        absolute: true,
      }),
    })

    setOutput('All done! Run `yarn rw lint --fix` to prettify your code')
  })
}
